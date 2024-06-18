import styles from "@/styles/FormatList.module.scss";

interface FormatListProps {
  available_resolutions: {
    res: string;
    itag: number;
    type: string;
  }[];
  chooseResolution: (resolution: string) => void;
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
      {available_resolutions.map((resolution) => (
        <li key={resolution.itag}>
          <button
            onClick={() => chooseResolution(resolution.res)}
            disabled={videoProcessing || resolutionLoading}
          >
            <p>{resolution.res}</p>
            <p>
              {resolution.type === "video/mp4"
                ? "mp4"
                : resolution.type === "audio/mp4"
                ? "m4a"
                : "webm"}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default FormatList;
