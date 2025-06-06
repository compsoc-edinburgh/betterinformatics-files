import React, { useEffect, useState } from "react";
import { useUserAnswers } from "../api/hooks";
import AnswerComponent from "./answer";
import { Alert, Loader, Text, Box, Tooltip, Group } from "@mantine/core";
import classes from "./user-answers.module.css";
import { useUser } from "../auth";
import { IconInfoCircle } from "@tabler/icons-react";
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

const UserAnswers: React.FC<UserAnswersProps> = ({ username }) => {
  const [page, setPage] = useState(0); // to indicate what page of answers should be loaded
  const [error, loading, data, reload] = useUserAnswers(username, -1);
  const [answers, setAnswers] = useState(data);
  const [lastElement, setLastElement] = useState<HTMLDivElement | null>(null);
  const { username: currentUsername, isAdmin } = useUser()!;

  // Check if viewing own profile
  const isOwnProfile = username === currentUsername;

  const PAGE_SIZE = 10; // loads a limited amount of new elements at a time when scrolling down

  useEffect(() => {
    if (data) setAnswers([...data]);
  }, [data]);

  // resets the cards if we're on a new users page
  useEffect(() => {
    setPage(0);
    setAnswers(undefined);
  }, [username]);

  // sets the observer to the last element once it is rendered
  useEffect(() => {
    // called if the last answer is seen, resulting in a new set of answers being loaded
    const handleObserver = (
      entities: IntersectionObserverEntry[],
      _: IntersectionObserver,
    ) => {
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
    };
  }, [lastElement]);

  return (
    <>
      {error && <Alert color="red">{error.message}</Alert>}
      {isOwnProfile && (
        <Box mb="md">
          <Alert color="blue" title={
            <Group>
              <Tooltip
                label="Your anonymous answers are only visible to you and admins on this page. Other users viewing your profile won't see your anonymous answers."
                multiline
                maw={300}
                withArrow
                withinPortal
              >
                <IconInfoCircle size={16} style={{ cursor: 'pointer' }} />
              </Tooltip>
              <Text>Your Answers</Text>
            </Group>
          }>
            {isAdmin ?
              "As an admin, you can see all answers including anonymous ones." :
              "This page shows all your answers. Your anonymous answers are only visible to you and admins."}
          </Alert>
        </Box>
      )}
      {(!answers || answers.length === 0) && !loading && (
        <Alert color="gray">No answers</Alert>
      )}
      <div className={classes.column}>
        {answers &&
          answers.slice(0, (page + 1) * PAGE_SIZE).map(answer => (
            <div key={answer.oid} style={{ marginBottom: "1rem" }}>
              <AnswerComponent
                hasId={false}
                answer={answer}
                onSectionChanged={reload}
              />
            </div>
          ))}
        <div ref={elem => setLastElement(elem)} />
      </div>
      {loading && <Loader style={{ display: "flex", margin: "auto" }} />}
    </>
  );
};
export default UserAnswers;
