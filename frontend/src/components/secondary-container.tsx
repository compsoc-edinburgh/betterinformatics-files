import React from "react";
import { Box, createStyles, DefaultProps, Divider } from "@mantine/core";
const useStyles = createStyles(theme => ({
  contentContainer: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[5]
        : theme.colors.gray[0],
  },
}));

interface ContentContainerProps extends DefaultProps {
  className?: string;
}

const ContentContainer: React.FC<ContentContainerProps> = ({
  children,
  className,
  ...others
}) => {
  const { classes } = useStyles();
  return (
    <>
      <Divider mt="lg" {...others} />
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
