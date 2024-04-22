import React, { useCallback, useEffect, useState } from "react";
import { Text, Title } from "@mantine/core";
import Panel from "./panel-left";
import { CategoryMetaData } from "../interfaces";

export interface DisplayOptions {
  displayHiddenPdfSections: boolean;
  displayHiddenAnswerSections: boolean;
  displayHideShowButtons: boolean;
  displayEmptyCutLabels: boolean;
}

interface CourseCategoriesPanelProps {
  mode: string;
  isOpen: boolean;
  toggle: () => void;
  metaList: [string, [string, CategoryMetaData[]][]][] | undefined;
}
const CourseCategoriesPanel: React.FC<CourseCategoriesPanelProps> = ({
  mode,
  isOpen,
  toggle,
  metaList,
}) => {
  const scrollToTop = useCallback(() => {
    const c = document.documentElement.scrollTop || document.body.scrollTop;
    if (c > 0) {
      window.requestAnimationFrame(scrollToTop);
      window.scrollTo(0, c - c / 10 - 1);
    } else {
      toggle();
    }
  }, [toggle]);

  const slugify = (str: string): string =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const scrollToElementById = (id: string): void => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const [availableLetters, setAvailableLetters] = useState<Map<string, string>>(); //mapping between available letters and element id of first category card with that letter
  
  useEffect(() => {
    const letters = new Map<string, string>();
    const elems = Array.from(document.getElementsByClassName("category-card")).sort((a, b) => a.id.localeCompare(b.id)); //make sure to sort category cards by id (not guaranteed if mode isn't alphabetical)
    for (let i = 0; i < elems.length; i++) {
      const letter = elems[i].id.toUpperCase().at(0);
      if (letter && !letters.has(letter)) {
        letters.set(letter, elems[i].id);
      }
    }
    setAvailableLetters(letters);
  }, []);

  return (
    <Panel
      header={mode === "alphabetical" ? "Alphabet" : "Semester"}
      isOpen={isOpen}
      toggle={toggle}
    >
      {mode === "alphabetical"
        ? availableLetters && Array.from(availableLetters, ([letter, id]) => (
            <div key={letter}>
              <Title
                order={5}
                my="sm"
                style={{
                  cursor: "pointer",
                }}
                onClick={() => scrollToElementById(id)}
              >
                {letter}
              </Title>
            </div>
          ))
        : metaList &&
          metaList.map(([meta1display, meta2]) => (
            <div key={meta1display}>
              <Title
                order={4}
                my="sm"
                style={{
                  cursor: "pointer",
                }}
                onClick={() => scrollToElementById(slugify(meta1display))}
              >
                {meta1display}
              </Title>
              {meta2.map(([meta2display, categories]) => (
                <div key={meta2display}>
                  <Text
                    mb="xs"
                    style={{
                      cursor: "pointer",
                    }}
                    onClick={() => scrollToElementById(slugify(meta1display) + slugify(meta2display))}
                  >
                    {meta2display}
                  </Text>
                </div>
              ))}
            </div>
          ))}
    </Panel>
  );
};
export default CourseCategoriesPanel;
