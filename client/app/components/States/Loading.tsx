import SyncLoader from "react-spinners/SyncLoader";
import styles from "@/styles/states/Loading.module.scss";

interface LoadingProps {
  loadingMessage: string;
}

const Loading = ({ loadingMessage }: LoadingProps) => {
  return (
    <div className={styles["wrapper"]}>
      <div className={styles["content"]}>
        <SyncLoader color="#f7fff9" size={13} />
        <h1>{loadingMessage}</h1>
      </div>
    </div>
  );
};

export default Loading;
