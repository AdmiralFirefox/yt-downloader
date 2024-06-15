from flask import Flask, jsonify, request, current_app, send_from_directory
from flask_socketio import SocketIO
from flask_cors import CORS
from pytube import YouTube
from collections import OrderedDict
from cloudinary import uploader, config
from dotenv import load_dotenv
import threading
import shutil
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
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

VIDEO_FOLDER = "/tmp/downloaded_yt_video"

# Check if the upload folder exists in /tmp and create it if it doesn't
if not os.path.exists(VIDEO_FOLDER):
    os.makedirs(VIDEO_FOLDER)
else:
    print(f"{VIDEO_FOLDER} folder already exists.")


# Initialize the application context
with app.app_context():
    current_app.available_resolutions = OrderedDict()
    current_app.previous_video_public_id = None


def delete_all_files():
    # Delete all old uploaded images
    for filename in os.listdir(VIDEO_FOLDER):
        file_path = os.path.join(VIDEO_FOLDER, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f'Failed to delete {file_path}. Reason: {e}')


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


def upload_video_to_cloudinary(video_stream):
    video_stream.download(output_path=VIDEO_FOLDER)
   
    filename = os.path.splitext(video_stream.default_filename)
    file_path = os.path.join(VIDEO_FOLDER, video_stream.default_filename)

    # Clean filename title for public_id (Remove emojis)
    emoji_pattern = r"[^\w\s_-]"
    cleaned_title = re.sub(emoji_pattern, "", filename[0])   

    upload_result = uploader.upload_large(file_path,
                                    public_id=cleaned_title,
                                    resource_type="video")
    
    current_app.previous_video_public_id = upload_result["public_id"]
    return upload_result["url"]


def process_video(video_stream):
    video_url = upload_video_to_cloudinary(video_stream)

    return video_url


def on_progress(stream, chunk, bytes_remaining):
    total_size = stream.filesize
    bytes_downloaded = total_size - bytes_remaining
    percentage_of_completion = bytes_downloaded / total_size * 100
    int_percentage = str(int(percentage_of_completion))
    socketio.emit("progress", {"percentage": int_percentage})


@app.route("/api/download_options", methods=["POST"])
def download_options():
    # Clear all files in the directory
    delete_all_files()

    # Clear the available_resolutions dictionary
    current_app.available_resolutions.clear()

    data = request.get_json()
    input_link = data.get("inputLink") # defined in useState

    yt_video = YouTube(input_link)

    streams = convert_to_dict_list(yt_video.streams.filter(progressive=True))

    # Create an ordered dictionary to keep the first occurrence of each resolution
    for stream in streams:
        if stream["res"] not in current_app.available_resolutions:
            current_app.available_resolutions[stream["res"]] = stream["itag"]
    
    # Convert available_resolutions into the desired list of dictionaries format
    available_resolutions_list = [{"res": res, "itag": itag} for res, itag in current_app.available_resolutions.items()]

    return jsonify({
        "available_resolutions": available_resolutions_list,
    })


def download_video_thread(saved_link, input_resolution):
    with app.app_context():
        try:
            yt_video = YouTube(saved_link, on_progress_callback=on_progress)

            if input_resolution in current_app.available_resolutions:
                video_itag = current_app.available_resolutions[input_resolution]
                
                # Delete the previous video if it exists
                previous_video_public_id = current_app.previous_video_public_id
                if previous_video_public_id:
                    try:
                        uploader.destroy(previous_video_public_id, resource_type="video")
                    except Exception as e:
                        print(f"Failed to delete previous video: {e}")

                video_url = process_video(video_stream=yt_video.streams.get_by_itag(video_itag))

                socketio.emit("video_ready", {
                    "message": "Your video is ready to download",
                    "video_url": video_url
                })
        except Exception as e:
            socketio.emit("video_ready", {
                "message": f"Error: {str(e)}",
                "video_url": "error",
            })


@app.route("/api/download_video", methods=["POST"])
def download_video():
    # Clear all files in the directory
    delete_all_files()

    data = request.get_json()
    input_resolution = data.get("resolution")
    saved_link = data.get("savedLink")

    # Start a new thread to handle the video download
    threading.Thread(target=download_video_thread, args=(saved_link, input_resolution)).start()

    return jsonify({
        "initial_message": "Video download has started, you will be notified when it is ready."
    })


if __name__ == "__main__":
    socketio.run(app, port=8000)