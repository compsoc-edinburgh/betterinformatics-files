import React from "react";
import { Alert, Loader } from "@mantine/core";
import Grid from "../components/grid";
import { useUser } from "../auth";
import { UserInfo } from "../interfaces";
import DocumentCard from "./document-card";
import type { DocumentSchema } from "../api/model/documentSchema";
import { useListDocuments } from "../api/hooks/documents";

interface UserDocumentsProps {
  username: string;
  userInfo?: UserInfo;
}
const UserDocuments: React.FC<UserDocumentsProps> = ({
  username,
  userInfo,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = useUser()!;
  const isMyself = user.username === username;
  const documents = useListDocuments({
    username,
  });
  const likedDocuments = useListDocuments(
    {
      liked_by: username,
    },
    {
      query: {
        enabled: isMyself,
      },
    },
  );
  const displayDocuments = (documents: DocumentSchema[]) => {
    return (
      <Grid>
        {documents.map(document => (
          <DocumentCard key={document.slug} document={document} showCategory />
        ))}
      </Grid>
    );
  };
  return (
    <>
      <h3>
        {isMyself ? "Your" : `${userInfo?.displayName ?? `@${username}`}'s`}{" "}
        Documents
      </h3>
      {documents.isError && (
        <Alert color="red">{documents.error as unknown as string}</Alert>
      )}
      {documents.data && displayDocuments(documents.data.value)}
      {(!documents.data || documents.data.value.length === 0) && (
        <Alert color="gray">No documents</Alert>
      )}
      {documents.isLoading && <Loader />}

      {isMyself && (
        <>
          <h3>Liked Documents</h3>
          {likedDocuments.isError && (
            <Alert color="red">
              {likedDocuments.error as unknown as string}
            </Alert>
          )}
          {likedDocuments.data && displayDocuments(likedDocuments.data.value)}
          {(!likedDocuments.data || likedDocuments.data.value.length === 0) && (
            <Alert color="gray">No liked documents</Alert>
          )}
          {likedDocuments.isLoading && <Loader />}
        </>
      )}
    </>
  );
};

export default UserDocuments;
