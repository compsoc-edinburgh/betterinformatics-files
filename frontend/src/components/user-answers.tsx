import { keyframes, css } from "@emotion/css";
import { Alert, Spinner } from "@vseth/components";
import React, { useEffect, useRef, useState } from "react";
import Masonry from "react-masonry-component";
import { useUserAnswers } from "../api/hooks";
import { Answer } from "../interfaces";
import AnswerComponent from "./answer";
// `transform: translateX(0)` fixes an issue on webkit browsers
// where relative positioned elements aren't displayed in containers
// with multiple columns. This is a quick-fix as pointed out on the
// webkit bug reporting platform.
// Example: https://codepen.io/lukasmoeller/pen/JjGyJXY (rel is hidden)
// Issue: https://gitlab.ethz.ch/vis/cat/community-solutions/-/issues/147
// Webkit Bug: https://bugs.webkit.org/show_bug.cgi?id=209681
// It seems like there is a fix live in Safari Technology Preview
// This fix should be left in here until the fix is published for
// Safari iOS + macOS

interface UserAnswersProps {
  username: string;
}

const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

const masonryStyle = css`
  display: flex;
  margin: auto;
  width: 80vw;
  justify-content: center;
  align-items: center;
  position: relative;

  .answer-component {
    // makes the answer components half the size of the masonry div
    // resulting in 2 columns
    width: 40vw;
    animation: ${fadeIn} 800ms;    
  }
  @media only screen and (max-width: 1000px) {
    .answer-component {
      width: 80vw;
    }
  }
  // fix to counter the odd move to the right that is happening at around 580px width
  @media only screen and (min-width: 580px) {
    left: -10%;
  }
`;


const UserAnswers: React.FC<UserAnswersProps> = ({ username }) => {
  const [page, setPage] = useState(0); // to indicate what page of answers should be loaded
  const [error, loading, pageAnswers, reload] = useUserAnswers(username, page);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [lastElement, setLastElement] = useState<HTMLDivElement | null>(null);
  const [allElementsLoaded, setAllElementsLoaded] = useState(false);
  useEffect(() => {
    // ignore if pageAnswers isn't set yet
    if (!pageAnswers) return;
    // disables the spinner once all pages have been loaded
    if (pageAnswers.length === 0) {
      setAllElementsLoaded(true);
      return;
    }
    setAnswers(old => [...old, ...pageAnswers]);
  }, [pageAnswers]);

  // sets the observer to the last element once it is rendered
  useEffect(() => {
    // called if the last answer is seen, resulting in a new set of answers being loaded
    const handleObserver = (entities: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      const first = entities[0];
      if (first.isIntersecting) {
        setPage(no => no + 1);
      }
    };
    const observer = new IntersectionObserver(handleObserver);
    if (lastElement) {
      observer.observe(lastElement);
    }
    return () => {
      if (lastElement) {
        observer.unobserve(lastElement);
      }
    }
  }, [lastElement]);

  return (
    <>
      {error && <Alert color="danger">{error.message}</Alert>}
      {(!answers || answers.length === 0) && <Alert color="secondary">No answers</Alert>}
      <div className={masonryStyle}>
        <Masonry
          options={{ fitWidth: true, transitionDuration: 0 }}
          enableResizableChildren={true}
        >
          {answers &&
            answers.map((answer) => (
              <div className="px-2 answer-component" key={answer.oid}>
                <AnswerComponent
                  hasId={false}
                  answer={answer}
                  isLegacyAnswer={answer.isLegacyAnswer}
                  onSectionChanged={reload}
                />
              </div>
            ))}
          <div ref={elem => setLastElement(elem)} />
        </Masonry>
      </div>
      {!allElementsLoaded && loading && <Spinner style={{ "display": "flex", "margin": "auto" }} />}
    </>
  );
};
export default UserAnswers;
