import { useRequest } from "@umijs/hooks";
import { Button, Icon, ICONS, Spinner, ButtonGroup } from "@vseth/components";
import React from "react";
import { fetchPost } from "../api/fetch-utils";
import { AnswerSection } from "../interfaces";

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
    <ButtonGroup style={{ margin: "0 0.3em" }}>
      <Button
        size="sm"
        style={{ minWidth: 0 }}
        disabled={userVote === -1}
        outline={userVote === -1}
        onClick={() => setLike(oid, -1)}
      >
        <Icon icon={ICONS.MINUS} size={18} />
      </Button>
      <Button
        size="sm"
        style={{ minWidth: 0, color: "black" }}
        disabled={userVote === 0}
        outline
        onClick={() => setLike(oid, 0)}
      >
        {loading ? <Spinner size="sm" /> : upvotes}
      </Button>
      <Button
        size="sm"
        style={{ minWidth: 0 }}
        disabled={userVote === 1}
        outline={userVote === 1}
        onClick={() => setLike(oid, 1)}
      >
        <Icon icon={ICONS.PLUS} size={18} />
      </Button>
    </ButtonGroup>
  );
};
export default Score;
