import styles from "@/styles/FormatList.module.scss";

interface FormatListProps {
  available_resolutions: {
    res: string;
    itag: number;
    type: string;
    progressive: string;
  }[];
  chooseResolution: (resolutionIndex: number) => void;
  videoProcessing: boolean;
  resolutionLoading: boolean;
}

const FormatList = ({
  available_resolutions,
  chooseResolution,
  videoProcessing,
  resolutionLoading
}: FormatListProps) => {
  return (
    <ul className={styles["resolutions-wrapper"]}>
      {available_resolutions.map((resolution, index) => (
        <li key={resolution.itag}>
          <button
            onClick={() => chooseResolution(index)}
            disabled={videoProcessing || resolutionLoading}
          >
            <p>{resolution.res}</p>
            <p>
              {resolution.type === "video/mp4" && resolution.progressive === "False"
                ? "mp4 (video only)"
                : resolution.type === "video/webm" && resolution.progressive === "False"
                ? "webm (video only)"
                : resolution.type === "audio/mp4" && resolution.progressive === "False"
                ? "m4a (audio only)"
                : resolution.type === "audio/webm" && resolution.progressive === "False"
                ? "webm (audio only)"
                : resolution.type === "video/mp4" && resolution.progressive === "True"
                ? "mp4"
                : "mp4"
                }
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default FormatList;
