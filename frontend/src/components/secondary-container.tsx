import React from "react";
import { Box, createStyles, Divider } from "@mantine/core";
interface Props {
  className?: string;
}

const useStyles = createStyles(theme => ({
  contentContainer: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[5]
        : theme.colors.gray[1],
  },
}));

const ContentContainer: React.FC<Props> = ({ children, className }) => {
  const { classes } = useStyles();
  return (
    <>
      <Divider mt="lg" />
      <Box
        py="md"
        px={0}
        className={`${classes.contentContainer} ${
          className ? ` ${className}` : ""
        }`}
      >
        {children}
      </Box>
      <Divider />
    </>
  );
};
export default ContentContainer;
