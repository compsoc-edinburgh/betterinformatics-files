import React from "react";
import { useDissertations } from "../api/hooks";
import { Title, Text } from "@mantine/core";

interface Props {
  slug: string;
}

const DissertationList: React.FC<Props> = ({ slug }) => {
  const { data, loading, error } = useDissertations("", "", slug);

  return (
    <>
      <Title order={2} mb="md">
        Relevant Dissertations
      </Title>
      <Text opacity={0.7} mb="md" size="sm">
        Did you enjoy the contents of this course? You can check out
        dissertations that have worked on related topics, which might help in
        finding a dissertation topic or understanding what kind of work is being
        done in this area.
      </Text>
      {data?.length}
    </>
  );
};

export default DissertationList;
