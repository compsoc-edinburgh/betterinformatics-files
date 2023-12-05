import { createStyles } from "@mantine/core";

export const useStyles = createStyles(theme => ({
  focusOutline: {
    "&:focus": {
      outlineWidth: 1.5,
      outlineStyle: "solid",
      outlineColor: theme.colors.gray[9],
      outlineOffset: 2,
    },
  },
}));
