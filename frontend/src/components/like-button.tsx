import { Button } from "@mantine/core";
import React from "react";
import { Mutate, useUpdateDocument } from "../api/hooks";
import { Document } from "../interfaces";
import classes from "./like-button.module.css";

interface Props {
  document: Document;
  mutate: Mutate<Document>;
}

const LikeButton: React.FC<Props> = ({ document, mutate }) => {
  const [_, updateDocument] = useUpdateDocument(
    document.author,
    document.slug,
    () => void 0,
  );
  const nonLikeCount = document.like_count - (document.liked ? 1 : 0);
  const likeCount = document.like_count + (document.liked ? 0 : 1);
  return (
    <Button
      variant="subtle"
      onClick={() => {
        updateDocument({ liked: !document.liked });
        if (!document.liked) {
          mutate(s => ({ ...s, liked: true, like_count: likeCount }));
        } else {
          mutate(s => ({ ...s, liked: false, like_count: nonLikeCount }));
        }
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        height="1em"
        className={document.liked ? classes.bounce : classes.rubberBand}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          className={document.liked ? classes.redFilled : classes.outlined}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <div style={{ position: "relative", marginLeft: "0.5em" }}>
        <div
          className={
            document.liked
              ? classes.likedNumberActive
              : classes.likedNumberInactive
          }
        >
          {likeCount}
        </div>
        <div
          className={
            !document.liked
              ? classes.notLikedNumberActive
              : classes.notLikedNumberInactive
          }
        >
          {nonLikeCount}
        </div>
      </div>
    </Button>
  );
};

export default LikeButton;
