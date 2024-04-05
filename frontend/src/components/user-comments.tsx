import React, { useEffect, useState } from "react";
import { useUserComments } from "../api/hooks";
import SingleCommentComponent from "./comment-single";
import { Alert, Loader } from "@mantine/core";
import classes from "./user-comments.module.css";

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

interface UserCommentsProps {
  username: string;
}

const UserComments: React.FC<UserCommentsProps> = ({ username }) => {
  const [page, setPage] = useState(0); // to indicate what page of answers should be loaded
  const [error, loading, data] = useUserComments(username, -1);
  const [comments, setComments] = useState(data);
  const [lastElement, setLastElement] = useState<HTMLDivElement | null>(null);

  const PAGE_SIZE = 10; // loads a limited amount of new elements at a time when scrolling down

  useEffect(() => {
    if (data) setComments([...data]);
  }, [data]);

  // resets the cards if we're on a new users page
  useEffect(() => {
    setPage(0);
    setComments(undefined);
  }, [username]);

  // sets the observer to the last element once it is rendered
  useEffect(() => {
    // called if the last answer is seen, resulting in a new set of answers being loaded
    const handleObserver = (
      entities: IntersectionObserverEntry[],
      observer: IntersectionObserver,
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
      {(!comments || comments.length === 0) && !loading && (
        <Alert color="gray">No comments</Alert>
      )}
      <div className={classes.column}>
        {comments &&
          comments.slice(0, (page + 1) * PAGE_SIZE).map(comment => (
            <div key={comment.oid}>
              <SingleCommentComponent comment={comment} />
            </div>
          ))}
        <div ref={elem => setLastElement(elem)} />
      </div>
      {loading && <Loader style={{ display: "flex", margin: "auto" }} />}
    </>
  );
};
export default UserComments;
