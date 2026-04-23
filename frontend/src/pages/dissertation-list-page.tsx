import React from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Anchor,
  Breadcrumbs,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { IconChevronRight, IconUpload } from "@tabler/icons-react";
import { DissertationList } from "../components/dissertation-list";
import ContentContainer from "../components/secondary-container";

const DissertationListPage: React.FC = () => {
  return (
    <>
      <Container size="xl" style={{ position: "relative" }}>
        <Breadcrumbs
          mb="sm"
          separator={<IconChevronRight />}
          styles={{
            breadcrumb: {
              minWidth: 0,
              textOverflow: "ellipsis",
              overflow: "hidden",
            },
          }}
        >
          <Anchor tt="uppercase" size="xs" component={Link} to="/">
            Home
          </Anchor>
          <Anchor tt="uppercase" size="xs" component={Link} to="/dissertations">
            Dissertations
          </Anchor>
        </Breadcrumbs>
        <Title order={2} mb="sm">
          Dissertation Archive
        </Title>
        <Text>
          The School of Informatics officially maintains{" "}
          <Anchor
            component={Link}
            c="blue"
            to="https://project-archive.inf.ed.ac.uk/"
          >
            an internal archive
          </Anchor>{" "}
          of all dissertations submitted by students. However, this archive is
          only visible to staff members, and students can only see outstanding
          dissertations of past years. This page provides an alternative public
          archive of dissertations by students who have consented to share their
          work. If you are a student and would like to share your dissertation,
          please use the &ldquo;Add My Dissertation&rdquo; button below.
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
          leftSection={<IconUpload size={14} />}
        >
          Add My Dissertation
        </Button>
      </Container>

      <ContentContainer>
        <Container size="xl" mt="md">
          <DissertationList />
        </Container>
      </ContentContainer>
    </>
  );
};

export default DissertationListPage;
