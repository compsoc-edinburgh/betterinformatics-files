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

interface DocumentCardProps {
  document: Document;
  showCategory?: boolean;
}
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
        <div>
          <Link to={`/user/${document.author}`} className="text-muted">
            @{document.author}
          </Link>
          {document.liked ? (
            <span className="text-danger ml-2">
              <LikeFilledIcon className="mr-1" /> {document.like_count}
            </span>
          ) : (
            <span className="text-muted ml-2">
              <LikeIcon className="mr-1" /> {document.like_count}
            </span>
          )}
          {showCategory && (
            <Badge className="ml-2">
              <Link to={`/category/${document.category}`}>
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
