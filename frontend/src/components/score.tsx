import { useRequest } from "@umijs/hooks";
import { ButtonGroup, Icon, ICONS, Spinner } from "@vseth/components";
import React from "react";
import { fetchPost } from "../api/fetch-utils";
import { AnswerSection } from "../interfaces";
import SmallButton from "./small-button";

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
    <ButtonGroup className="m-1">
      <SmallButton
        tooltip="Downvote"
        size="sm"
        disabled={userVote === -1}
        outline={userVote === -1}
        onClick={() => setLike(oid, -1)}
      >
        <Icon icon={ICONS.MINUS} size={18} />
      </SmallButton>
      <SmallButton
        tooltip="Reset vote"
        size="sm"
        style={{ color: "black" }}
        disabled={userVote === 0}
        outline
        onClick={() => setLike(oid, 0)}
      >
        {loading ? <Spinner size="sm" /> : upvotes}
      </SmallButton>
      <SmallButton
        tooltip="Upvote"
        size="sm"
        disabled={userVote === 1}
        outline={userVote === 1}
        onClick={() => setLike(oid, 1)}
      >
        <Icon icon={ICONS.PLUS} size={18} />
      </SmallButton>
    </ButtonGroup>
  );
};
export default Score;
