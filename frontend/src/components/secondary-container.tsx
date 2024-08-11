import React from "react";
import { Box, DividerProps, Divider } from "@mantine/core";
import classes from "./secondary-container.module.css";

interface ContentContainerProps extends DividerProps {
  className?: string;
  children?: React.ReactNode;
}

const ContentContainer: React.FC<ContentContainerProps> = ({
  children,
  className,
  ...others
}) => {
  return (
    <>
      <Box
        py="md"
        px={0}
        className={`${classes.contentContainer} ${
          className ? ` ${className}` : ""
        }`}
      >
        {children}
      </Box>
    </>
  );
};
export default ContentContainer;
