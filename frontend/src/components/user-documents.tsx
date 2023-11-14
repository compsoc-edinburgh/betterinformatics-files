import React from "react";
import { Alert, Anchor, Flex, Loader, Paper, Group, Text } from "@mantine/core";
import { Icon, ICONS } from "vseth-canine-ui";
import { useDocumentsLikedBy, useDocumentsUsername } from "../api/hooks";
import { Link } from "react-router-dom";
import Grid from "../components/grid";
import { useUser } from "../auth";
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
            <Paper p="md" withBorder shadow="md" key={document.slug}>
              <Anchor
                size="lg"
                weight={600}
                component={Link}
                to={`/user/${document.author}/document/${document.slug}`}
              >
                <Text>{document.display_name}</Text>
              </Anchor>
              <Group mt="sm" position="apart">
                <Anchor component={Link} to={`/user/${document.author}`}>
                  <Text color="dimmed">@{document.author}</Text>
                </Anchor>
                {document.liked ? (
                  <Flex align="center" color="red">
                    <Icon icon={ICONS.LIKE_FILLED} color="red" />
                    <Text fw={700} color="red" ml="0.3em">
                      {document.like_count}
                    </Text>
                  </Flex>
                ) : (
                  <Flex align="center">
                    <Icon icon={ICONS.LIKE} />
                    <Text fw={700} ml="0.3em">
                      {document.like_count}
                    </Text>
                  </Flex>
                )}
              </Group>
            </Paper>
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
        <Alert color="secondary">No documents</Alert>
      )}
      {loading && <Loader />}

      {isMyself && (
        <>
          <h3>Liked Documents</h3>
          {likedError && <Alert color="red">{likedError.toString()}</Alert>}
          {likedDocuments && displayDocuments(likedDocuments)}
          {(!likedDocuments || likedDocuments.length === 0) && (
            <Alert color="secondary">No liked documents</Alert>
          )}
          {likedLoading && <Loader />}
        </>
      )}
    </>
  );
};

export default UserDocuments;
