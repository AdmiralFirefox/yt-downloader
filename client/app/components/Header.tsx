import Image from "next/image";
import styles from "@/styles/Header.module.scss";

const Header = () => {
  return (
    <header className={styles["header"]}>
      <h1>YT Media Downloader</h1>
      <div className={styles["logo-wrapper"]}>
        <Image src="/web-logo.png" alt="Web Logo" width={200} height={200} />
      </div>
    </header>
  );
};

export default Header;
