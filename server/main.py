from flask import Flask, jsonify, request, current_app
from flask_socketio import SocketIO, join_room, leave_room
from flask_cors import CORS
from pytubefix import YouTube
from clear_videos import delete_files_with_pattern
from collections import OrderedDict
from cloudinary import uploader, config
from dotenv import load_dotenv
import uuid
import os
import re

# Load environment variables
load_dotenv()

# Configure Cloudinary
config(
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME")
)

# App instance
app = Flask(__name__)
app.secret_key = os.getenv("APP_SECRET_KEY")
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

VIDEO_FOLDER = "/tmp/downloaded_yt_video"

# Check if the upload folder exists in /downloaded_yt_video and create it if it doesn't
if not os.path.exists(VIDEO_FOLDER):
    os.makedirs(VIDEO_FOLDER)
else:
    print(f"{VIDEO_FOLDER} folder already exists.")


# Initialize the application context
with app.app_context():
    current_app.progressive_resolutions = OrderedDict()
    current_app.video_resolutions = OrderedDict()
    current_app.audio_resolutions = OrderedDict()
    current_app.combined_resolutions = OrderedDict()

# Converting Stream to List of Dictionaries
def convert_to_dict_list(stream_list):
    dict_list = []
    for stream in stream_list:
        # Extracting the contents between the angle brackets
        stream_str = str(stream)
        attributes = re.findall(r'(\w+)="([^"]+)"', stream_str)

        # Converting the list of tuples to a dictionary
        stream_dict = {key: value for key, value in attributes}

        # Adding the dictionary to the list
        dict_list.append(stream_dict)

    return dict_list


def process_video(video_stream, session_id):
    # Download the video
    video_path = video_stream.download(output_path=VIDEO_FOLDER)
    
    # Get the file extension
    _, extension = os.path.splitext(video_path)
    
    # Create the new filename with UUID
    base_name = os.path.basename(video_path)
    new_filename = f"{os.path.splitext(base_name)[0]}_{session_id}{extension}"
    
    # Construct the new path
    new_path = os.path.join(VIDEO_FOLDER, new_filename)
    
    # Rename the file
    os.rename(video_path, new_path)

    # Extract the original filename without extension for Cloudinary public_id
    original_filename = os.path.splitext(base_name)[0]

    # Clean filename title for public_id (Remove emojis)
    emoji_pattern = r"[^\w\s_-]"
    cleaned_title = re.sub(emoji_pattern, "", original_filename).strip()

    # Upload video to cloudinary
    upload_result = uploader.upload_large(new_path,
                                    public_id=cleaned_title,
                                    folder="yt-downloader",
                                    resource_type="video")
    
    app.config["PREVIOUS_VIDEO_PUBLIC_ID"] = upload_result["public_id"]
    app.config["PREVIOUS_VIDEO_RESOURCE_TYPE"] = upload_result["resource_type"]
    return upload_result["url"] # Return url from cloudinary


def on_progress(stream, chunk, bytes_remaining):
    total_size = stream.filesize
    bytes_downloaded = total_size - bytes_remaining
    percentage_of_completion = bytes_downloaded / total_size * 100
    int_percentage = str(int(percentage_of_completion))

    session_id = app.config.get("SESSION_ID")
    socketio.emit("progress", {"percentage": int_percentage}, room=session_id)


@app.route("/api/download_options", methods=["POST"])
def download_options():
    # Delete the previous video if it exists
    previous_video_public_id = app.config.get("PREVIOUS_VIDEO_PUBLIC_ID")
    previous_video_resource_type = app.config.get("PREVIOUS_VIDEO_RESOURCE_TYPE")
    if previous_video_public_id:
        try:
            uploader.destroy(previous_video_public_id, resource_type=previous_video_resource_type)
        except Exception as e:
            print(f"Failed to delete previous video: {e}")

    # Clear dictionaries
    current_app.progressive_resolutions.clear()
    current_app.video_resolutions.clear()
    current_app.audio_resolutions.clear()
    current_app.combined_resolutions.clear()

    data = request.get_json()
    input_link = data.get("inputLink") # defined in useState

    yt_video = YouTube(input_link)

    streams = convert_to_dict_list(yt_video.streams.filter(progressive=True))
    audio_streams = convert_to_dict_list(yt_video.streams.filter(only_audio=True, adaptive=True))
    video_streams = convert_to_dict_list(yt_video.streams.filter(only_video=True, adaptive=True))

    # Create an ordered dictionary to keep the first occurrence of progressive resolution
    for stream in streams:
        if stream["itag"] not in current_app.progressive_resolutions:
            current_app.progressive_resolutions[stream["itag"]] = (stream["res"], stream["mime_type"], stream["progressive"])

    # Create an ordered dictionary to keep the first occurrence of each abr
    for stream in audio_streams:
        if stream["itag"] not in current_app.audio_resolutions:
            current_app.audio_resolutions[stream["itag"]] = (stream["abr"], stream["mime_type"], stream["progressive"])
    
    # Create an ordered dictionary to keep the first occurrence of each video resolution
    for stream in video_streams:
        if stream["itag"] not in current_app.video_resolutions:
            current_app.video_resolutions[stream["itag"]] = (stream["res"], stream["mime_type"], stream["progressive"])
    
    # Combine all dictionaries
    combine_resolutions = OrderedDict(
        list(current_app.progressive_resolutions.items()) + 
        list(current_app.audio_resolutions.items()) + 
        list(current_app.video_resolutions.items())
    )
    filtered_combine_resolutions = OrderedDict((k, v) for k, v in combine_resolutions.items() if v[0] != "None")
    current_app.combined_resolutions = filtered_combine_resolutions
    
    # Convert available resolutions into the desired list of dictionaries format
    available_resolutions_list = [
        {"itag": res, "res": itag_type[0], "type": itag_type[1], "progressive": itag_type[2]}
        for res, itag_type in current_app.combined_resolutions.items()
    ]

    return jsonify({
        "available_resolutions": available_resolutions_list,
        "thumbnail_url": yt_video.thumbnail_url,
        "video_title": yt_video.title,
        "video_length": yt_video.length
    })


def download_video_thread(saved_link, input_resolution):
    with app.app_context():
        session_id = app.config.get("SESSION_ID")

        try:
            yt_video = YouTube(saved_link, on_progress_callback=on_progress)
            resolution_keys = list(current_app.combined_resolutions.keys())

            # Check if chosen resolution is available in list of resolutions
            if 0 <= input_resolution < len(resolution_keys):
                video_itag = resolution_keys[input_resolution]

                # Get url from cloudinary
                video_url = process_video(video_stream=yt_video.streams.get_by_itag(video_itag), session_id=session_id)

                socketio.emit("video_ready", {
                    "video_url": video_url,
                    "video_filesize": yt_video.streams.get_by_itag(video_itag).filesize
                }, room=session_id)
        except Exception as e:
            socketio.emit("video_ready", {
                "error_message": f"Error: {str(e)}",
                "video_url": "error",
            }, room=session_id)
        finally:
            socketio.emit("video_processing_status", {
                "video_processing": False
            }, room=session_id)
            delete_files_with_pattern(VIDEO_FOLDER, str(session_id))


@app.route("/api/download_video", methods=["POST"])
def download_video():
    data = request.get_json()
    input_resolution = data.get("resolutionIndex")
    saved_link = data.get("savedLink")

    # Generate a new unique session ID
    session_id = str(uuid.uuid4())
    app.config["SESSION_ID"] = session_id

    # Start a new thread to handle the video download
    socketio.start_background_task(download_video_thread, saved_link, input_resolution)

    return jsonify({
        "resolution_index": input_resolution,
        "session_id": session_id,
    })


@socketio.on("connect")
def handle_connect():
    session_id = request.args.get("sessionId")
    join_room(session_id)


@socketio.on("disconnect")
def handle_disconnect():
    session_id = request.args.get("sessionId")
    leave_room(session_id)


if __name__ == "__main__":
    socketio.run(app, port=8000)