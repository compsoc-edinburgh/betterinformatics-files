import { Container, Grid } from "@mantine/core";
import React from "react";
import UploadPdfCard from "../components/upload-pdf-card";
import useTitle from "../hooks/useTitle";

const UploadPdfPage: React.FC<{}> = () => {
  useTitle("Upload PDF");
  return (
    <Container size="xl">
      <Grid>
        <Grid.Col span="auto" />
        <Grid.Col span={{ lg: 6 }}>
          <UploadPdfCard />
        </Grid.Col>
        <Grid.Col span="auto" />
      </Grid>
    </Container>
  );
};
export default UploadPdfPage;
