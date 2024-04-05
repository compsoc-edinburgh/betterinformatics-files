import { Container, Grid } from "@mantine/core";
import React from "react";
import UploadTranscriptCard from "../components/upload-transcript-card";
import useTitle from "../hooks/useTitle";

const UploadTranscriptPage: React.FC<{}> = () => {
  useTitle("Upload Transcript");
  return (
    <Container size="xl">
      <Grid>
        <Grid.Col span="auto" />
        <Grid.Col span={{ lg: 6 }}>
          <UploadTranscriptCard />
        </Grid.Col>
        <Grid.Col span="auto" />
      </Grid>
    </Container>
  );
};
export default UploadTranscriptPage;
