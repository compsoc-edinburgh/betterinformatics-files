import React from "react";
import { Alert, Loader } from "@mantine/core";
import { useDocumentsLikedBy, useDocumentsUsername } from "../api/hooks";
import Grid from "../components/grid";
import { useUser } from "../auth";
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
      {documentsError && <Alert color="red">{documentsError.toString()}</Alert>}
      {documents && displayDocuments(documents)}
      {(!documents || documents.length === 0) && (
        <Alert color="gray">No documents</Alert>
      )}
      {loading && <Loader />}

      {isMyself && (
        <>
          <h3>Liked Documents</h3>
          {likedError && <Alert color="red">{likedError.toString()}</Alert>}
          {likedDocuments && displayDocuments(likedDocuments)}
          {(!likedDocuments || likedDocuments.length === 0) && (
            <Alert color="gray">No liked documents</Alert>
          )}
          {likedLoading && <Loader />}
        </>
      )}
    </>
  );
};

export default UserDocuments;
