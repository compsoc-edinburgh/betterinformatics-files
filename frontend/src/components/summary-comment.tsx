import React from "react";
import { Link } from "react-router-dom";
import { Card, Icon, ICONS } from "@vseth/components";
import SmallButton from "./small-button";
import { Summary, SummaryComment } from "../interfaces";
import { useUser } from "../auth/";
import { useDeleteSummaryComment, Mutate } from "../api/hooks";

interface Props {
  summarySlug: string;
  comment: SummaryComment;
  mutate: Mutate<Summary>;
}
const SummaryCommentComponent = ({ summarySlug, comment, mutate }: Props) => {
  const { isAdmin } = useUser()!;
  const [loading, deleteComment] = useDeleteSummaryComment(
    summarySlug,
    comment.oid,
    () =>
      mutate(summary => ({
        ...summary,
        comments: summary.comments.filter(c => c.oid !== comment.oid),
      })),
  );
  return (
    <Card className="my-3 pt-2" body>
      <div className="d-flex justify-content-between">
        <Link to={`/user/${comment.authorId}`}>
          {comment.authorDisplayName}
          <span className="text-muted ml-2">@{comment.authorId}</span>
        </Link>
        <div>
          {(comment.canEdit || isAdmin) && (
            <SmallButton
              tooltip="Delete comment"
              size="sm"
              color="white"
              onClick={deleteComment}
            >
              <Icon icon={ICONS.DELETE} size={18} />
            </SmallButton>
          )}

          {comment.canEdit && (
            <SmallButton tooltip="Edit comment" size="sm" color="white">
              <Icon icon={ICONS.EDIT} size={18} />
            </SmallButton>
          )}
        </div>
      </div>
      {comment.text}
    </Card>
  );
};

export default SummaryCommentComponent;
