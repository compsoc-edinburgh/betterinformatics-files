import { useRequest } from "@umijs/hooks";
import {
  Button,
  Icon,
  ICONS,
  InputGroup,
  InputGroupAddon,
  Spinner,
} from "@vseth/components";
import React from "react";
import { fetchpost } from "../api/fetch-utils";
import { AnswerSection } from "../interfaces";

const setLikeReq = async (oid: string, like: -1 | 0 | 1) => {
  return (await fetchpost(`/api/exam/setlike/${oid}/`, { like }))
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
    <InputGroup size="sm">
      <InputGroupAddon addonType="prepend">
        <Button
          size="sm"
          style={{ minWidth: 0 }}
          disabled={userVote === -1}
          outline={userVote === -1}
          onClick={() => setLike(oid, -1)}
        >
          <Icon icon={ICONS.MINUS} size={18} />
        </Button>
      </InputGroupAddon>
      <InputGroupAddon addonType="prepend">
        <Button
          size="sm"
          style={{ minWidth: 0, color: "black" }}
          disabled={userVote === 0}
          outline
          color={expertUpvotes ? "primary" : undefined}
          onClick={() => setLike(oid, 0)}
        >
          {loading ? (
            <Spinner size="sm" />
          ) : expertUpvotes ? (
            expertUpvotes
          ) : (
            upvotes
          )}
        </Button>
      </InputGroupAddon>
      <InputGroupAddon addonType="append">
        <Button
          size="sm"
          style={{ minWidth: 0 }}
          disabled={userVote === 1}
          outline={userVote === 1}
          onClick={() => setLike(oid, 1)}
        >
          <Icon icon={ICONS.PLUS} size={18} />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
};
export default Score;
