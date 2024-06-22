import ErrorIcon from "../Icons/ErrorIcon";
import styles from "@/styles/States/Error.module.scss";

interface ErrorProps {
  errorMessage: string;
}

const Error = ({ errorMessage }: ErrorProps) => {
  return (
    <div className={styles["wrapper"]}>
      <div className={styles["content"]}>
        <ErrorIcon width="4.75em" height="4.3em" />
        <h1>{errorMessage}</h1>
      </div>
    </div>
  );
};

export default Error;
