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
      <Divider mt="lg" className={classes.unOffsetFullWidth} {...others} />
      <Box
        py="md"
        className={`${classes.fullWidthContentContainer} ${classes.unOffsetFullWidth} ${
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
