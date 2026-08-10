import { Alert, Paper } from "@mantine/core";
import { useUser } from "../auth";
import { PageResponse } from "../api/model";
import { useListRevisions } from "../api/hooks/pages";
import CodeBlock from "./code-block";

export const PageArticleHistory: React.FC<{
  page: PageResponse;
}> = ({ page }) => {
  const user = useUser();

  const { data: revisions, isLoading, isError } = useListRevisions(page.slug);

  // Revisions only visible if logged in
  if (!user?.loggedin) {
    return (
      <Alert title="Login Required">
        You must be logged in to view the revision history of this page.
      </Alert>
    );
  }

  if (isLoading) {
    return "Loading...";
  }

  if (isError) {
    return (
      <Alert title="Error" color="red">
        There was an error loading the revision history.
      </Alert>
    );
  }

  return (
    <Paper flex={1}>
      {revisions?.revisions.map(revision => (
        <Paper key={revision.id} p="md" mb="sm" shadow="xs">
          {revision.message} - {revision.author.username} -{" "}
          {new Date(revision.created_at).toLocaleString()}
          <CodeBlock
            value={revision.content_delta}
            language="diff"
            customStyle={{
              lineHeight: 1,
              overflowX: "hidden",
              maxWidth: "100%",
            }}
          />
        </Paper>
      ))}
    </Paper>
  );
};
