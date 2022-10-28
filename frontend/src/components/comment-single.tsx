import {
  Col,
  CardHeader,
  CardBody,
  Row,
  Card,
  Breadcrumb,
  BreadcrumbItem,
} from "@vseth/components";
import { differenceInSeconds, formatDistanceToNow } from "date-fns";
import React from "react";
import { Link } from "react-router-dom";
import { SingleComment } from "../interfaces";
import MarkdownText from "./markdown-text";
import { css } from "@emotion/css";

interface Props {
  comment: SingleComment;
}

const noMarginBreadcrumb = css`
  & .breadcrumb {
    margin: 0;
  }
`;
const marginCommentText = css`
  margin: 1em;
`;

const SingleCommentComponent: React.FC<Props> = ({ comment }) => {
  return (
    <Card className={marginCommentText}>
      <CardHeader>
        <Row>
          <Col xs="auto">
            <Breadcrumb className={noMarginBreadcrumb}>
              <BreadcrumbItem>
                <Link to={`/category/${comment.category_slug}`}>
                  {comment.category_displayname}
                </Link>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <Link to={`/exams/${comment.filename}`}>
                  {comment.exam_displayname}
                </Link>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <Link to={`/exams/${comment.filename}#${comment.answerId}`}>
                  Comment
                </Link>
              </BreadcrumbItem>
            </Breadcrumb>
          </Col>
        </Row>
        <div>
          <Link to={`/user/${comment.authorId}`}>
            <span className="text-dark font-weight-bold">
              {comment.authorDisplayName}
            </span>
            <span className="text-muted ml-1">@{comment.authorId}</span>
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
      </CardHeader>
      <CardBody>
        <MarkdownText value={comment.text} />
      </CardBody>
    </Card>
  );
};

export default SingleCommentComponent;
