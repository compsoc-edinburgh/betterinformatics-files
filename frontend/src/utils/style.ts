import { createStyles } from "@mantine/core";

export const useStyles = createStyles(theme => ({
  focusOutline: {
    transition: "box-shadow 150ms ease, transform 100ms ease",
    "&:hover": {
      boxShadow: theme.shadows.md,
      transform: "scale(1.05)",
    },
    "&:focus": {
      outlineWidth: 1.5,
      outlineStyle: "solid",
      outlineColor: theme.colors.gray[9],
      outlineOffset: 2,
    },
  },
}));
