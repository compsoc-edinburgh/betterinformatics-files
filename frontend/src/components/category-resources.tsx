import React from "react";
import { CategoryMetaData } from "../interfaces";
import { Anchor, Flex, Group, List, Text, Title } from "@mantine/core";
import ExamList from "./exam-list";
import DocumentList from "./document-list";
import { DissertationList } from "./dissertation-list";
import { Link } from "react-router-dom";
import { IconArrowRight } from "@tabler/icons-react";

export const CategoryResources: React.FC<{
  metaData: CategoryMetaData;
}> = ({ metaData }) => {
  return (
    <>
      <ExamList metaData={metaData} />

      <DocumentList slug={metaData.slug} />

      {metaData.attachments.length > 0 && (
        <>
          <Title order={2} mt="xl" mb="lg">
            Attachments
          </Title>
          <List>
            {metaData.attachments.map(att => (
              <List.Item key={att.filename}>
                <Anchor
                  href={`/api/filestore/get/${att.filename}/`}
                  c="blue"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {att.displayname}
                </Anchor>
              </List.Item>
            ))}
          </List>
        </>
      )}

      <Title order={2} mt="xl" mb="sm">
        Relevant Dissertations
      </Title>
      <Text c="gray" size="sm">
        Did you enjoy the contents of this course?
      </Text>
      <Text c="gray" mb="md" size="sm">
        You can check out dissertations that students have claimed are related
        to this course. These might help in finding a dissertation topic, a
        supervisor, or understanding what kind of novel work is being done in
        this area.
      </Text>
      <DissertationList slug={metaData.slug} disableSearch />
      <Flex justify="flex-end" mt="md">
        <Anchor component={Link} to="/dissertations" fz="sm" c="blue">
          <Group gap="sm">
            View Dissertations in All Categories <IconArrowRight />
          </Group>
        </Anchor>
      </Flex>
    </>
  );
};
