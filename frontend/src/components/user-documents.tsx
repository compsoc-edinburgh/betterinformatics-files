import React from "react";
import { Spinner, Alert } from "@vseth/components";
import { useDocumentsLikedBy, useDocumentsUsername } from "../api/hooks";
import Grid from "../components/grid";
import { useUser } from "../auth";
import ContentContainer from "./secondary-container";
import { Document, UserInfo } from "../interfaces";
import DocumentCard from "./document-card";

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
            <DocumentCard
              key={document.slug}
              document={document}
              showCategory
            />
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
      {loading && <Spinner />}

      {isMyself && (
        <ContentContainer className="my-3">
          <h3>Liked Documents</h3>
          {likedError && <Alert color="danger">{likedError.toString()}</Alert>}
          {likedDocuments && displayDocuments(likedDocuments)}
          {(!likedDocuments || likedDocuments.length === 0) && (
            <Alert color="secondary">No liked documents</Alert>
          )}
          {likedLoading && <Spinner />}
        </ContentContainer>
      )}
    </>
  );
};

export default UserDocuments;
