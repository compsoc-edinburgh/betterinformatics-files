import React, { useCallback, useEffect, useState } from "react";
import Panel from "./panel-left";
import { CategoryMetaData } from "../interfaces";
import { Mode } from '../pages/home-page';

export interface DisplayOptions {
  displayHiddenPdfSections: boolean;
  displayHiddenAnswerSections: boolean;
  displayHideShowButtons: boolean;
  displayEmptyCutLabels: boolean;
}

interface CourseCategoriesPanelProps {
  mode: number,
  isOpen: boolean;
  toggle: () => void;
  metaList:  [string, [string, CategoryMetaData[]][]][] | undefined;
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
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
    const scrollToDiv = (id: string): void => {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: 'smooth' });
    };
    const scrollToDivLetter = (letter: string): void => {
      const els = document.getElementsByClassName('stretched-link text-dark');
      for (let i = 0; i < els.length; i++) {
        if (els[i].firstElementChild?.firstElementChild?.innerHTML.toLowerCase().startsWith(letter.toLowerCase())) {
          els[i]?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
    };

  const alphabet = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  ];
  const [availableLetters, setAvailableLetters] = useState<string[]>(alphabet);
  useEffect(() => {
    const avails = [];
    const elss = document.getElementsByClassName('stretched-link text-dark');
    for (let i = 0; i < alphabet.length; i++) {
      for (let j = 0; j < elss.length; j++) {
        if (elss[j].firstElementChild?.firstElementChild?.innerHTML.toLowerCase().startsWith(alphabet[i].toLowerCase())) {
          avails.push(alphabet[i]);
          break;
        }
      }
    }
    setAvailableLetters(avails)
  }, [metaList]);

  return (
    <Panel header={mode === Mode.Alphabetical ? "Alphabet" : "Semester"} isOpen={isOpen} toggle={toggle}>
      { 
          mode === Mode.Alphabetical ? (
          availableLetters.map((letter) => (
            <div key={letter}>
              <h5 className='my-3'
                style={{
                  cursor: 'pointer',
                }} onClick={() => scrollToDivLetter(letter)}>
                {letter}
              </h5>
            </div>
          ))
        ) : 
        (
          metaList && metaList.map(([meta1display, meta2]) => (
            <div key={meta1display}>
              <h5 className='my-3'
                style={{
                  cursor: 'pointer',
                }} onClick={() => scrollToDiv(slugify(meta1display))}>
                {meta1display}
              </h5>
              {meta2.map(([meta2display, categories]) => (
                <div key={meta2display}>
                  <p className='mb-2' style={{
                      cursor: 'pointer',
                    }} onClick={() => scrollToDiv(slugify(meta1display) + slugify(meta2display))}>
                    {meta2display}
                  </p>
                </div>
              ))}
            </div>
          ))
        )
      }
    </Panel>
  );
};
export default CourseCategoriesPanel;
