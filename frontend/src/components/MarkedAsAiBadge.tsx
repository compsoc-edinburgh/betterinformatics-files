import React from "react";
import { Text, Tooltip } from "@mantine/core";
import { IconRobot } from "@tabler/icons-react";

interface MarkedAsAiBadgeProps {
  count: number;
}

const MarkedAsAiBadge: React.FC<MarkedAsAiBadgeProps> = ({ count }) => {
  if (count < 1) return null;

  const color = count >= 6 ? "red.7" : count >= 3 ? "yellow.7" : "blue.6";
  const label =
    count >= 6
      ? "Very likely AI-generated"
      : count >= 3
        ? "Likely AI-generated"
        : "Potentially AI-generated";

  return (
    <Tooltip
      label="This is based on community reports and may not be accurate. Always use your own judgement when evaluating answers."
      multiline
      w={280}
    >
      <Text c={color} size="xs" mt={2} style={{ cursor: "default" }}>
        <IconRobot
          size={12}
          style={{ verticalAlign: "middle", marginRight: 4 }}
        />
        {label}
      </Text>
    </Tooltip>
  );
};

export default MarkedAsAiBadge;
