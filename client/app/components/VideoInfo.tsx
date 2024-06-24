import Image from "next/image";
import styles from "@/styles/VideoInfo.module.scss";

interface VideoInfoProps {
  thumbnail_url: string;
  video_title: string;
  video_length: number;
}

const VideoInfo = ({
  thumbnail_url,
  video_title,
  video_length,
}: VideoInfoProps) => {
  const convertTime = (d: number) => {
    d = Number(d);
    let h = Math.floor(d / 3600);
    let m = Math.floor((d % 3600) / 60);
    let s = Math.floor((d % 3600) % 60);

    let hDisplay = h > 0 ? h + (h == 1 ? " hour" : " hours") : "";
    let mDisplay = m > 0 ? m + (m == 1 ? " minute" : " minutes") : "";
    let sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";

    let result = [hDisplay, mDisplay, sDisplay].filter(Boolean).join(", ");
    return result;
  };

  return (
    <div className={styles["video-info-wrapper"]}>
      <div className={styles["video-thumbnail"]}>
        <Image
          src={thumbnail_url}
          alt="YouTube thumbnail"
          width={300}
          height={300}
          unoptimized
        />
      </div>
      <p className={styles["video-title"]}>{video_title}</p>
      <p className={styles["video-duration"]}>Duration: {convertTime(video_length)}</p>
    </div>
  );
};

export default VideoInfo;
