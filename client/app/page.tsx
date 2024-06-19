"use client";

import { FormEvent, useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Axios from "axios";
import io from "socket.io-client";
import FormInputLink from "./components/FormInputLink";
import FormatList from "./components/FormatList";
import { Line } from "rc-progress";
import styles from "@/styles/page.module.scss";

interface InputProps {
  available_resolutions: {
    res: string;
    itag: number;
    type: string;
  }[];
}

interface ResolutionProps {
  chosen_resolution: string;
}

const backendUrl = "http://localhost:8000";

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

const sendResolution = async (resolution: string, savedLink: string) => {
  const response = await Axios.post(
    `${backendUrl}/api/download_video`,
    { resolution, savedLink },
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
  const [videoProcessing, setVideoProcessing] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [readyMessage, setReadyMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const mutation = useMutation<InputProps, Error, typeof inputLink>({
    mutationFn: sendInputLink,
  });

  // Mutation for resolution
  const resolution_mutation = useMutation<
    ResolutionProps,
    Error,
    { resolution: string; savedLink: string }
  >({
    mutationFn: ({ resolution, savedLink }) =>
      sendResolution(resolution, savedLink),
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(inputLink);
    setSavedLink(inputLink);
    setInputLink("");
  };

  const chooseResolution = (resolution: string) => {
    setVideoProcessing(null);
    setProgress(null);
    setDownloadUrl(null);
    setReadyMessage(null);
    resolution_mutation.mutate({
      resolution: resolution,
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
    setReadyMessage(null);
  };

  useEffect(() => {
    const socket = io(backendUrl);

    socket.on("progress", (data: { percentage: string }) => {
      setProgress(parseInt(data.percentage, 10));
    });

    socket.on(
      "video_processing_status",
      (data: { video_processing: boolean }) => {
        setVideoProcessing(data.video_processing);
      }
    );

    socket.on("video_ready", (data: { message: string; video_url: string }) => {
      setReadyMessage(data.message);
      setDownloadUrl(data.video_url);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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

      {mutation.isPending && <p>Loading...</p>}
      {mutation.isError && <p>An error occurred.</p>}
      {mutation.isSuccess && mutation.data !== undefined && (
        <FormatList
          available_resolutions={mutation.data.available_resolutions}
          chooseResolution={chooseResolution}
          videoProcessing={videoProcessing as boolean}
          resolutionLoading={resolution_mutation.isPending}
        />
      )}

      {resolution_mutation.isPending && <p>Loading...</p>}
      {resolution_mutation.isError && <p>An error occurred.</p>}
      {resolution_mutation.isSuccess &&
        resolution_mutation.data !== undefined && (
          <div className={styles["processing-format-text"]}>
            <p>Processing Format...</p>
            <div className={styles["chosen-format-text"]}>
              <p>Chosen Format:</p>
              <p className={styles["format"]}>
                {resolution_mutation.data.chosen_resolution}
              </p>
            </div>
          </div>
        )}

      {progress !== null && (
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
      )}

      <div className={styles["download-ready-wrapper"]}>
        {progress === 100 && readyMessage === null && downloadUrl === null && (
          <p>Preparing download link. Please wait.</p>
        )}

        {readyMessage !== null && <p>{readyMessage}</p>}

        {downloadUrl !== null && downloadUrl !== "error" && (
          <a href={downloadUrl} download>
            Click here to download
          </a>
        )}
      </div>
    </main>
  );
}
