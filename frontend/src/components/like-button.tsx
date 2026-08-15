import { Button } from "@mantine/core";
import React from "react";
import classes from "./like-button.module.css";
import { useUpdateDocument } from "../api/hooks/documents";
import type { DocumentSchema } from "../api/model/documentSchema";

interface Props {
  document: DocumentSchema;
  refetch: () => void;
}

const LikeButton: React.FC<Props> = ({ document, refetch }) => {
  const updateDocument = useUpdateDocument({
    mutation: {
      onSuccess() {
        refetch();
      },
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const nonLikeCount = document.like_count! - (document.liked ? 1 : 0);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const likeCount = document.like_count! + (document.liked ? 0 : 1);
  return (
    <Button
      variant="subtle"
      onClick={() => {
        updateDocument.mutate({
          slug: document.slug,
          data: {
            liked: !document.liked,
          },
        });
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
