"use client";

import { FormEvent, useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Axios from "axios";
import styles from "@/styles/page.module.scss";

interface InputProps {
  available_resolutions: {
    res: string;
    itag: number;
  }[];
}

interface ResolutionProps {
  message: string;
  video_url: string;
}

const sendInputLink = async (inputLink: string) => {
  const response = await Axios.post(
    "/api/download_options",
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
    "/api/download_video",
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
  };

  useEffect(() => {
    if (resolution_mutation.isSuccess && resolution_mutation.data?.video_url) {
      setDownloadUrl(resolution_mutation.data.video_url);
    }
  }, [resolution_mutation.isSuccess, resolution_mutation.data]);

  return (
    <main>
      <h1>Enter Link</h1>
      {savedLink ? null : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputLink}
            onChange={(e) => setInputLink(e.target.value)}
          />
          <button type="submit">Submit</button>
        </form>
      )}

      {savedLink ? (
        <button onClick={clearInputs}>Download another video</button>
      ) : null}

      {mutation.isPending && <p>Loading...</p>}
      {mutation.isError && <p>An error occurred.</p>}
      {mutation.isSuccess && mutation.data !== undefined && (
        <ul>
          {mutation.data.available_resolutions.map((resolution) => (
            <li key={resolution.itag}>
              <button
                onClick={() => chooseResolution(resolution.res)}
                disabled={resolution_mutation.isPending}
              >
                {resolution.res}
              </button>
            </li>
          ))}
        </ul>
      )}

      {resolution_mutation.isPending && <p>Loading...</p>}
      {resolution_mutation.isError && <p>An error occurred.</p>}
      {resolution_mutation.isSuccess &&
        resolution_mutation.data !== undefined && (
          <div>
            <p>{resolution_mutation.data.message}</p>
            {downloadUrl && (
              <a href={downloadUrl} download>
                Click here to download
              </a>
            )}
          </div>
        )}
    </main>
  );
}
