import React from "react";
import { Document } from "../interfaces";
import {
  Badge,
  Card,
  CardBody,
  CardTitle,
  LikeFilledIcon,
  LikeIcon,
} from "@vseth/components";
import { Link } from "react-router-dom";
import { css, cx } from "@emotion/css";

interface DocumentCardProps {
  document: Document;
  showCategory?: boolean;
}

const overflowHiddenStyles = css`
  overflow: hidden;
`;

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  showCategory,
}) => {
  return (
    <Card>
      <CardBody>
        <Link
          className="text-primary"
          to={`/user/${document.author}/document/${document.slug}`}
        >
          <CardTitle tag="h6">{document.display_name}</CardTitle>
        </Link>
        <div className="d-flex align-items-center">
          <Link to={`/user/${document.author}`} className="text-muted">
            @{document.author}
          </Link>
          <div>
            {document.liked ? (
              <span className="text-danger ml-2 d-flex align-items-center">
                <LikeFilledIcon className="mr-1" /> {document.like_count}
              </span>
            ) : (
              <span className="text-muted ml-2 d-flex align-items-center">
                <LikeIcon className="mr-1" /> {document.like_count}
              </span>
            )}
          </div>
          {showCategory && (
            <Badge className={cx(overflowHiddenStyles, "ml-2")}>
              <Link
                className="align-middle d-inline-block text-truncate mw-100"
                to={`/category/${document.category}`}
              >
                {document.category_display_name}
              </Link>
            </Badge>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default DocumentCard;
