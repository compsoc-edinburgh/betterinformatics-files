import React from "react";
import { Button, Paper } from "@mantine/core";
import { IconChevronUp, IconFlag, IconX } from "@tabler/icons-react";
import TooltipButton from "./TooltipButton";

interface FlaggedBadgeProps {
  count: number;
  isFlagged: boolean;
  loading: boolean;
  size?: string;
  onToggle: () => void;
}

const FlaggedBadge: React.FC<FlaggedBadgeProps> = ({
  count,
  isFlagged,
  loading,
  size,
  onToggle,
}) => {
  if (count === 0) return null;

  return (
    <Paper shadow="xs" mr="md">
      <Button.Group>
        <TooltipButton
          tooltip="Flagged as Inappropriate"
          color="red"
          px={12}
          variant="filled"
          size={size}
        >
          <IconFlag />
        </TooltipButton>
        <TooltipButton
          color="red"
          miw={30}
          tooltip={`${count} user${count === 1 ? "" : "s"} consider${count === 1 ? "s" : ""} this answer inappropriate.`}
          size={size}
        >
          {count}
        </TooltipButton>
        <TooltipButton
          px={8}
          tooltip={isFlagged ? "Remove inappropriate flag" : "Add inappropriate flag"}
          size={size ?? "sm"}
          loading={loading}
          style={{ borderLeftWidth: 0 }}
          onClick={onToggle}
        >
          {isFlagged ? <IconX /> : <IconChevronUp />}
        </TooltipButton>
      </Button.Group>
    </Paper>
  );
};

export default FlaggedBadge;
