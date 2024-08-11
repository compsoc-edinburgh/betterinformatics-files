import { Button, Paper } from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import React from "react";
import { fetchPost } from "../api/fetch-utils";
import { AnswerSection } from "../interfaces";
import TooltipButton from "./TooltipButton";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

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
    <Paper shadow="xs">
      <Button.Group>
        <TooltipButton
          px={8}
          tooltip="Downvote"
          size="sm"
          disabled={userVote === -1}
          onClick={() => setLike(oid, -1)}
        >
          <IconChevronDown />
        </TooltipButton>
        <TooltipButton
          tooltip="Reset vote"
          size="sm"
          px="sm"
          miw={40}
          loading={loading}
          onClick={() => setLike(oid, 0)}
        >
          {upvotes}
        </TooltipButton>
        <TooltipButton
          px={8}
          tooltip="Upvote"
          size="sm"
          disabled={userVote === 1}
          onClick={() => setLike(oid, 1)}
        >
          <IconChevronUp />
        </TooltipButton>
      </Button.Group>
    </Paper>
  );
};
export default Score;
