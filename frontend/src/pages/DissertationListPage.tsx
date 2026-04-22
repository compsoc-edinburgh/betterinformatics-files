import React from "react";
import { Container, Title, Text, Button } from "@mantine/core";
import { Link } from "react-router-dom";
import { IconUpload } from "@tabler/icons-react";
import { DissertationList } from "../components/dissertation-list";

const DissertationListPage: React.FC = () => {
  return (
    <Container size="xl" mt="xl" style={{ position: "relative" }}>
      <Title order={2} mb="md">
        Dissertation Archive
      </Title>
      <Text>
        The School of Informatics officially maintains{" "}
        <Link to="https://project-archive.inf.ed.ac.uk/">
          an internal archive
        </Link>{" "}
        of all dissertations submitted by students. However, this archive is
        only visible to staff members, and students can only see outstanding
        dissertations of past years. This page provides an alternative public
        archive of dissertations by students who have consented to share their
        work. If you are a student and would like to share your dissertation,
        please use the &ldquo;Upload New Dissertation&rdquo; button below.
      </Text>
      {/* <Space h="md" /><Text>
        In addition, our dissertation archive has nifty features not present in
        the official one, including:
      </Text>
      <List>
        <List.Item>Full-text search to quickly find dissertations.</List.Item>
        <List.Item>
          Linking to relevant courses to encourage students to find potential
          research areas.
        </List.Item>
      </List> */}
      <Button
        mt="md"
        component={Link}
        to="/upload-dissertation"
        style={{ marginBottom: "20px" }}
        leftSection={<IconUpload size={14} />}
      >
        Add My Dissertation
      </Button>

      <DissertationList />
    </Container>
  );
};

export default DissertationListPage;
