"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import Axios from "axios";
import io from "socket.io-client";
import { saveAs } from "file-saver";
import FormInputLink from "./components/FormInputLink";
import VideoInfo from "./components/VideoInfo";
import FormatList from "./components/FormatList";
import Accordion from "./components/Accordion/Accordion";
import Loading from "./components/States/Loading";
import Error from "./components/States/Error";
import { Line } from "rc-progress";
import { Bounce, toast } from "react-toastify";
import { bytesToSize } from "@/utils/bytesToSize";
import styles from "@/styles/page.module.scss";

interface InputProps {
  available_resolutions: {
    res: string;
    itag: number;
    type: string;
    progressive: string;
  }[];
  thumbnail_url: string;
  video_title: string;
  video_length: number;
}

interface ResolutionProps {
  resolution_index: number;
  session_id: string;
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  ? process.env.NEXT_PUBLIC_BACKEND_URL
  : "http://localhost:8000";

const sendInputLink = async (inputLink: string) => {
  const response = await Axios.post(
    `${backendUrl}/api/download_options`,
    { inputLink },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

const sendResolution = async (resolutionIndex: number, savedLink: string) => {
  const response = await Axios.post(
    `${backendUrl}/api/download_video`,
    { resolutionIndex, savedLink },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export default function Home() {
  const [inputLink, setInputLink] = useState("");
  const [savedLink, setSavedLink] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [videoProcessing, setVideoProcessing] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation<InputProps, Error, typeof inputLink>({
    mutationFn: sendInputLink,
  });

  // Mutation for resolution
  const resolution_mutation = useMutation<
    ResolutionProps,
    Error,
    { resolutionIndex: number; savedLink: string }
  >({
    mutationFn: ({ resolutionIndex, savedLink }) =>
      sendResolution(resolutionIndex, savedLink),
    onSuccess: (data) => {
      setSessionId(data.session_id);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (inputLink.includes("https://") && inputLink !== "") {
      mutation.mutate(inputLink);
      setSavedLink(inputLink);
      setInputLink("");
      setDownloadUrl(null);
      setFileSize(null);
    } else {
      toast.error("Enter a valid url", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    }
  };

  const chooseResolution = (resolutionIndex: number) => {
    setVideoProcessing(null);
    setProgress(null);
    setDownloadUrl(null);
    setFileSize(null);
    setErrorMessage(null);
    setTimeout(
      () => sectionRef.current?.scrollIntoView({ behavior: "smooth" }),
      500
    );
    resolution_mutation.mutate({
      resolutionIndex: resolutionIndex,
      savedLink: savedLink,
    });
  };

  const clearInputs = () => {
    setInputLink("");
    setSavedLink("");
    mutation.reset();
    resolution_mutation.reset();
    setVideoProcessing(null);
    setProgress(null);
    setDownloadUrl(null);
    setFileSize(null);
    setErrorMessage(null);
  };

  useEffect(() => {
    if (sessionId) {
      setVideoProcessing(true);

      const socket = io(backendUrl, {
        query: { sessionId: sessionId },
      });

      socket.on("progress", (data: { percentage: string }) => {
        setProgress(parseInt(data.percentage, 10));
      });

      socket.on(
        "video_processing_status",
        (data: { video_processing: boolean }) => {
          setVideoProcessing(data.video_processing);
        }
      );

      socket.on(
        "video_ready",
        (data: {
          video_url: string;
          video_filesize: number;
          error_message: string;
        }) => {
          setErrorMessage(data.error_message);
          setDownloadUrl(data.video_url);
          setFileSize(data.video_filesize);
        }
      );

      return () => {
        socket.disconnect();
      };
    }
  }, [sessionId]);

  // Trigger Automatic Download
  useEffect(() => {
    const downloadFile = async () => {
      try {
        if (
          downloadUrl !== null &&
          downloadUrl !== "error" &&
          savedLink !== ""
        ) {
          // Ensure downloadUrl is HTTPS
          const httpsDownloadUrl = downloadUrl.startsWith("http://")
            ? downloadUrl.replace("http://", "https://")
            : downloadUrl;

          const response = await fetch(httpsDownloadUrl);
          const blob = await response.blob();

          const fileName =
            mutation.data !== undefined
              ? mutation.data.video_title
              : "yt_downloader";
          const filePrefix =
            blob.type === "video/mp4"
              ? ".mp4"
              : blob.type === "video/webm"
              ? ".webm"
              : ".mp4";

          saveAs(blob, `${fileName}${filePrefix}`);
        }
      } catch (error) {
        console.error("Download failed:", error);
      }
    };

    downloadFile();
  }, [downloadUrl, mutation.data, savedLink]);

  return (
    <main>
      {savedLink ? null : (
        <FormInputLink
          inputLink={inputLink}
          handleSubmit={handleSubmit}
          setInputLink={setInputLink}
        />
      )}

      {savedLink ? (
        <div className={styles["another-video-button-wrapper"]}>
          <button onClick={clearInputs}>Download another video</button>
        </div>
      ) : null}

      {mutation.isPending && (
        <Loading loadingMessage="Loading available formats" />
      )}

      {mutation.isError && (
        <Error errorMessage="Something went wrong. Make sure you have a valid url entered and have a stable internet connection. Also, make sure that the video is not age restricted. Refresh the page and try again." />
      )}

      {mutation.isSuccess && mutation.data !== undefined && (
        <>
          <VideoInfo
            thumbnail_url={mutation.data.thumbnail_url}
            video_title={mutation.data.video_title}
            video_length={mutation.data.video_length}
          />
          <FormatList
            available_resolutions={mutation.data.available_resolutions}
            chooseResolution={chooseResolution}
            videoProcessing={videoProcessing as boolean}
            resolutionLoading={resolution_mutation.isPending}
          />
        </>
      )}

      {resolution_mutation.isPending && (
        <Loading loadingMessage="Preparing Format" />
      )}

      {resolution_mutation.isError && (
        <Error errorMessage="Something went wrong. Refresh the page and try again." />
      )}

      <div
        ref={sectionRef}
        style={{ height: "0.1em", scrollMargin: "14em" }}
      ></div>

      {resolution_mutation.isSuccess &&
        resolution_mutation.data !== undefined && (
          <div className={styles["processing-format-text"]}>
            <div className={styles["chosen-format-text"]}>
              <p>Chosen Format:</p>
              <p className={styles["format"]}>
                {mutation.data !== undefined &&
                  mutation.data.available_resolutions[
                    resolution_mutation.data.resolution_index
                  ].res}
              </p>
            </div>
          </div>
        )}

      {videoProcessing && progress === null ? (
        <Loading loadingMessage="Your chosen format is being processed. Please wait." />
      ) : null}

      {videoProcessing && progress !== null ? (
        <div className={styles["progress-wrapper"]}>
          <div className={styles["progress-content"]}>
            <Line
              percent={progress}
              strokeWidth={3.6}
              trailWidth={3.6}
              strokeColor="#55A3DD"
              trailColor="#636a83"
            />
            <p>{progress}%</p>
          </div>
        </div>
      ) : null}

      {progress === 100 && videoProcessing ? (
        <Loading loadingMessage="Preparing download link. Please wait." />
      ) : null}

      <div className={styles["download-ready-wrapper"]}>
        {downloadUrl !== null && downloadUrl !== "error" && savedLink !== "" ? (
          <>
            <p>Your download should start automatically. If it doesn&apos;t,</p>
            <a href={downloadUrl} download>
              Click here to download
            </a>
            <p>{bytesToSize(fileSize)}</p>
          </>
        ) : null}
      </div>

      {errorMessage !== null && downloadUrl === "error" ? (
        <Error errorMessage={errorMessage} />
      ) : null}

      <Accordion />

      <div className={styles["legal-note-wrapper"]}>
        <div className={styles["legal-note-content"]}>
          <p>Legal Note:</p>
          <p>
            It is essential that downloading videos for personal enjoyment is
            typically allowed, but it&apos;s crucial to respect copyright and
            intellectual property laws. It&apos;s important to ensure that
            downloaded videos are only for personal use and not shared or
            distributed without permission.
          </p>
        </div>
      </div>
    </main>
  );
}
