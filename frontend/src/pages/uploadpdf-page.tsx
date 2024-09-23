import { Card, Container, Grid, Title } from "@mantine/core";
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
          <Card withBorder shadow="md">
            <Card.Section withBorder p="md" mb="sm">
              <Title order={4}>Upload PDF</Title>
            </Card.Section>
            <UploadPdfCard />
          </Card>
        </Grid.Col>
        <Grid.Col span="auto" />
      </Grid>
    </Container>
  );
};
export default UploadPdfPage;
