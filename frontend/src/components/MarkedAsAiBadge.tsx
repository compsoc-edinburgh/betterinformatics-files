import React from "react";
import { Text, Tooltip } from "@mantine/core";
import { IconRobot } from "@tabler/icons-react";

interface MarkedAsAiBadgeProps {
  count: number;
}

const MarkedAsAiBadge: React.FC<MarkedAsAiBadgeProps> = ({ count }) => {
  if (count < 3) return null;

  const color = count >= 6 ? "red.7" : "yellow.7";
  const label = count >= 6 ? "Very likely AI-generated" : "Likely AI-generated";

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
