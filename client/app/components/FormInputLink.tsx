import { Dispatch, FormEvent, SetStateAction } from "react";
import styles from "@/styles/FormInputLink.module.scss";

interface FormInputLinkProps {
  inputLink: string;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setInputLink: Dispatch<SetStateAction<string>>;
}

const FormInputLink = ({
  inputLink,
  handleSubmit,
  setInputLink,
}: FormInputLinkProps) => {
  return (
    <>
      <div className={styles["form-wrapper"]}>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputLink}
            onChange={(e) => setInputLink(e.target.value)}
            placeholder="Paste a valid YouTube link here"
            required
          />
          <button type="submit">Convert</button>
        </form>
      </div>

      <div className={styles["clear-button-wrapper"]}>
        <button onClick={() => setInputLink("")}>Clear Input</button>
      </div>
    </>
  );
};

export default FormInputLink;
