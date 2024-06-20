import { useState } from "react";
import accordion_data from "@/data/accordion_data.json";
import AccordionItem from "./AccordionItem";
import styles from "@/styles/Accordion/Accordion.module.scss";

const Accordion = () => {
  const [clicked, setClicked] = useState(0);

  const handleToggle = (id: number) => {
    if (clicked === id) {
      return setClicked(0);
    }
    setClicked(id);
  };

  return (
    <div className={styles["accordion-section-wrapper"]}>
      <ul className={styles["accordion-section"]}>
        {accordion_data.map((data) => (
          <AccordionItem
            key={data.id}
            handleToggle={() => handleToggle(data.id)}
            active={clicked === data.id}
            data={data}
            id={data.id}
          />
        ))}
      </ul>
    </div>
  );
};

export default Accordion;
