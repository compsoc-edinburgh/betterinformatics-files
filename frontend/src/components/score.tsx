import { Loader, Button } from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import React from "react";
import { Icon, ICONS } from "vseth-canine-ui";
import { fetchPost } from "../api/fetch-utils";
import { AnswerSection } from "../interfaces";
import SmallButton from "./small-button";
import TooltipButton from "./TooltipButton";

const setLikeReq = async (oid: string, like: -1 | 0 | 1) => {
  return (await fetchPost(`/api/exam/setlike/${oid}/`, { like }))
    .value as AnswerSection;
};

interface Props {
  oid: string;
  upvotes: number;
  expertUpvotes: number;
  userVote: -1 | 0 | 1;
  onSectionChanged: (newSection: AnswerSection) => void;
}
const Score: React.FC<Props> = ({
  oid,
  upvotes,
  expertUpvotes,
  userVote,
  onSectionChanged,
}) => {
  const { loading, run: setLike } = useRequest(setLikeReq, {
    manual: true,
    onSuccess: onSectionChanged,
  });
  return (
    <Button.Group>
      <TooltipButton
        px={4}
        tooltip="Downvote"
        size="sm"
        disabled={userVote === -1}
        variant={userVote === -1 ? "outline" : "default"}
        onClick={() => setLike(oid, -1)}
      >
        <Icon icon={ICONS.MINUS} size={18} />
      </TooltipButton>
      <TooltipButton
        tooltip="Reset vote"
        size="sm"
        px="sm"
        disabled={userVote === 0}
        // variant="subtle"
        onClick={() => setLike(oid, 0)}
      >
        {loading ? <Loader size="sm" /> : upvotes}
      </TooltipButton>
      <TooltipButton
        px={4}
        tooltip="Upvote"
        size="sm"
        disabled={userVote === 1}
        variant={userVote === 1 ? "outline" : "default"}
        onClick={() => setLike(oid, 1)}
      >
        <Icon icon={ICONS.PLUS} size={18} />
      </TooltipButton>
    </Button.Group>
  );
};
export default Score;
