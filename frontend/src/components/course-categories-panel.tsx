import React, { useMemo } from "react";
import { Text, Title } from "@mantine/core";
import Panel from "./panel-left";
import { CategoryMetaData } from "../interfaces";
import { slugify } from "../utils/slugify";

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
  categories: readonly CategoryMetaData[];
}
const CourseCategoriesPanel: React.FC<CourseCategoriesPanelProps> = ({
  mode,
  isOpen,
  toggle,
  metaList,
  categories,
}) => {
  const availableLetters = useMemo<ReadonlyMap<string, string>>(() => {
    const letters = new Map<string, string>();
    const sorted = categories.toSorted((a, b) =>
      a.displayname.localeCompare(b.displayname),
    );
    for (const category of sorted) {
      const letter = category.displayname.at(0)?.toUpperCase();
      if (letter && !letters.has(letter)) {
        letters.set(letter, category.slug);
      }
    }

    return letters;
  }, [categories]);

  const scrollToElementById = (id: string): void => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const headerByMode: Record<string, string> = {
    alphabetical: "Alphabet",
    bySemester: "Semester",
    pinned: "Pinned",
  };
  const header = headerByMode[mode] ?? "Semester";

  return (
    <Panel header={header} isOpen={isOpen} toggle={toggle}>
      {mode === "alphabetical"
        ? [...availableLetters].map(([letter, id]) => (
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
        : metaList?.map(([meta1display, meta2]) => (
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
              {meta2.map(([meta2display]) => (
                <div key={meta2display}>
                  <Text
                    mb="xs"
                    style={{
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      scrollToElementById(slugify(meta1display + meta2display))
                    }
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
