import { useRef, FC } from "react";
import { IconContext } from "react-icons";
import { IoIosArrowDown } from "react-icons/io";
import styles from "@/styles/Accordion/AccordionItem.module.scss";

interface AccordionProps {
  data: {
    title: string;
    description: string;
  };
  active: boolean;
  handleToggle: (index: number) => void;
  id: number;
}

const AccordionItem: FC<AccordionProps> = ({
  data,
  active,
  handleToggle,
  id,
}) => {
  const contentEl = useRef<HTMLDivElement>(null);

  return (
    <li className={styles["accordion-item"]}>
      <button
        className={styles["accordion-header"]}
        onClick={() => handleToggle(id)}
      >
        <p>{data.title}</p>
        <IconContext.Provider
          value={{
            className:
              styles[active ? "accordion-icon-active" : "accordion-icon"],
          }}
        >
          <IoIosArrowDown />
        </IconContext.Provider>
      </button>
      <div
        ref={contentEl}
        className={styles["accordion-content-wrapper"]}
        style={
          active
            ? { height: contentEl.current!.scrollHeight }
            : { height: "0px" }
        }
      >
        <div className={styles["accordion-content"]}>
          <p>{data.description}</p>
        </div>
      </div>
    </li>
  );
};

export default AccordionItem;
