import React from "react";
import {
  Alert,
  Loader,
  Card,
} from "@mantine/core";
import { Icon, ICONS } from "vseth-canine-ui";
import { useDocumentsLikedBy, useDocumentsUsername } from "../api/hooks";
import { Link } from "react-router-dom";
import Grid from "../components/grid";
import { useUser } from "../auth";
import ContentContainer from "./secondary-container";
import { Document, UserInfo } from "../interfaces";

interface UserDocumentsProps {
  username: string;
  userInfo?: UserInfo;
}
const UserDocuments: React.FC<UserDocumentsProps> = ({
  username,
  userInfo,
}) => {
  const user = useUser()!;
  const isMyself = user.username === username;
  const [documentsError, loading, documents] = useDocumentsUsername(username);
  const [likedError, likedLoading, likedDocuments] = useDocumentsLikedBy(
    username,
    isMyself,
  );
  const displayDocuments = (documents: Document[]) => {
    return (
      <Grid>
        {documents &&
          documents.map(document => (
            <Card withBorder shadow="xs" key={document.slug}>
              <Link to={`/user/${document.author}/document/${document.slug}`}>
                <h6>{document.display_name}</h6>
              </Link>
              <div>
                <Link to={`/user/${document.author}`} className="text-muted">
                  @{document.author}
                </Link>
                {document.liked ? (
                  <span className="text-danger ml-2">
                    <Icon icon={ICONS.LIKE_FILLED} className="mr-1" /> {document.like_count}
                  </span>
                ) : (
                  <span className="text-muted ml-2">
                    <Icon icon={ICONS.LIKE} className="mr-1" /> {document.like_count}
                  </span>
                )}
              </div>
            </Card>
          ))}
      </Grid>
    );
  };
  return (
    <>
      <h3>
        {isMyself ? "Your" : `${userInfo?.displayName || `@${username}`}'s`}{" "}
        Documents
      </h3>
      {documentsError && (
        <Alert color="danger">{documentsError.toString()}</Alert>
      )}
      {documents && displayDocuments(documents)}
      {(!documents || documents.length === 0) && (
        <Alert color="secondary">No documents</Alert>
      )}
      {loading && <Loader />}

      {isMyself && (
        <ContentContainer className="my-3">
          <h3>Liked Documents</h3>
          {likedError && <Alert color="danger">{likedError.toString()}</Alert>}
          {likedDocuments && displayDocuments(likedDocuments)}
          {(!likedDocuments || likedDocuments.length === 0) && (
            <Alert color="secondary">No liked documents</Alert>
          )}
          {likedLoading && <Loader />}
        </ContentContainer>
      )}
    </>
  );
};

export default UserDocuments;
