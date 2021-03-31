import React from "react";
import { Link } from "react-router-dom";
import { Card, Icon, ICONS } from "@vseth/components";
import SmallButton from "./small-button";
import { Summary, SummaryComment } from "../interfaces";
import { useUser } from "../auth/";
import { useDeleteSummaryComment, Mutate } from "../api/hooks";
import { differenceInSeconds, formatDistanceToNow } from "date-fns";

interface Props {
  summaryAuthor: string;
  summarySlug: string;
  comment: SummaryComment;
  mutate: Mutate<Summary>;
}
const SummaryCommentComponent = ({
  summaryAuthor,
  summarySlug,
  comment,
  mutate,
}: Props) => {
  const { isAdmin } = useUser()!;
  const [loading, deleteComment] = useDeleteSummaryComment(
    summaryAuthor,
    summarySlug,
    comment.oid,
    () =>
      mutate(summary => ({
        ...summary,
        comments: summary.comments.filter(c => c.oid !== comment.oid),
      })),
  );
  return (
    <Card className="my-3 pt-3" body>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <div>
          <Link to={`/user/${comment.authorId}`}>
            {comment.authorDisplayName}
            <span className="text-muted ml-2">@{comment.authorId}</span>
          </Link>
          <span className="text-muted mx-1">·</span>
          {comment && (
            <span className="text-muted" title={comment.time}>
              {formatDistanceToNow(new Date(comment.time))} ago
            </span>
          )}
          {comment &&
            differenceInSeconds(
              new Date(comment.edittime),
              new Date(comment.time),
            ) > 1 && (
              <>
                <span className="text-muted mx-1">·</span>
                <span className="text-muted" title={comment.edittime}>
                  edited {formatDistanceToNow(new Date(comment.edittime))} ago
                </span>
              </>
            )}
        </div>
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
