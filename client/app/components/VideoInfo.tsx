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
  function convertTime(d: number) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor((d % 3600) / 60);
    var s = Math.floor((d % 3600) % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay;
  }

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
      <p>{video_title}</p>
      <p>Length: {convertTime(video_length)}</p>
    </div>
  );
};

export default VideoInfo;
