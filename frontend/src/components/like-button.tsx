import { Button } from "@vseth/components";
import { keyframes, css } from "emotion";
import React from "react";
import { useState } from "react";
import { Mutate, useUpdateDocument } from "../api/hooks";
import { Document } from "../interfaces";
const rubberBandAnimation = keyframes`
	0% {
		transform: scaleX(1)
	}

	30% {
		transform: scale3d(1.35, .75, 1)
	}

	40% {
		transform: scale3d(.55, 1.45, 1)
	}

	50% {
		transform: scale3d(1.15, .85, 1)
	}

	65% {
		transform: scale3d(.95, 1.05, 1)
	}

	75% {
		transform: scale3d(1.05, .95, 1)
	}

	to {
		transform: scaleX(1)
	}
`;
const rubberBand = css`
  animation-name: ${rubberBandAnimation};
  animation-duration: 1.1s;
  will-change: transform;
`;

const bounceAnimation = keyframes`
  0%, 20%, 40%, 60%, 80%, to {
		animation-timing-function: cubic-bezier(.215, .61, .355, 1)
	}

    5% {
		transform: scale3d(.3, .3, .3)
	}
	

	20% {
		transform: scale3d(1.3, 1.3, 1.3)
	}

	40% {
		transform: scale3d(.8, .8, .8)
	}

	60% {
		transform: scale3d(1.03, 1.03, 1.03)
	}

	80% {
		transform: scale3d(.97, .97, .97)
	}

	to {
		transform: scaleX(1)
	}
`;

const bounce = css`
  animation-name: ${bounceAnimation};
  animation-duration: 1.1s;
  will-change: transform;
`;

const fillAnimation = keyframes`
  0%, 20%, 40%, 60%, 80%, to {
		animation-timing-function: cubic-bezier(.215, .61, .355, 1)
	}

	0% {
		fill: var(--red);
    fill-opacity: 0;
    stroke: var(--dark);
	}

	20% {
		fill: var(--red);
    fill-opacity: 1;
		stroke: var(--red);
	}
`;

const redFilled = css`
  animation-name: ${fillAnimation};
  animation-duration: 1.1s;
  fill: var(--red);
  stroke: var(--red);
`;

const outlinedAnimation = keyframes`
  0% {
    fill: var(--red);
		stroke: var(--red);
  }
  30% {
    fill: var(--red);
		stroke: var(--red);
  }
	35% {
		fill: transparent;
    stroke: var(--dark);
	}
`;

const outlined = css`
  animation-name: ${outlinedAnimation};
  animation-duration: 1.1s;
`;

const likedNumberActive = css`
  transform-origin: top left;
  color: var(--red);
  transition: 0.5s all;
`;

const likedNumberInactive = css`
  transform-origin: top left;
  transform: translateY(-100%);
  opacity: 0;
  color: var(--red);
  transition: 0.5s all;
  transition-delay: 0.3s;
`;

const notLikedNumberActive = css`
  position: absolute;
  left: 0;
  top: 0;
  color: var(--dark);
  transition: 0.5s all;
  transition-delay: 0.3s;
`;
const notLikedNumberInactive = css`
  position: absolute;
  left: 0;
  top: 0;
  transform: translateY(100%);
  opacity: 0;
  color: var(--dark);
  transition: 0.5s all;
`;

interface Props {
  document: Document;
  mutate: Mutate<Document>;
}

const LikeButton: React.FC<Props> = ({ document, mutate }) => {
  const [loading, updateDocument] = useUpdateDocument(
    document.author,
    document.slug,
    () => void 0,
  );
  const nonLikeCount = document.like_count - (document.liked ? 1 : 0);
  const likeCount = document.like_count + (document.liked ? 0 : 1);
  return (
    <Button
      color="white"
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
        className={document.liked ? bounce : rubberBand}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          className={document.liked ? redFilled : outlined}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <div className="ml-2 position-relative">
        <div
          className={document.liked ? likedNumberActive : likedNumberInactive}
        >
          {likeCount}
        </div>
        <div
          className={
            !document.liked ? notLikedNumberActive : notLikedNumberInactive
          }
        >
          {nonLikeCount}
        </div>
      </div>
    </Button>
  );
};

export default LikeButton;
