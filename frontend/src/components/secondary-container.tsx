import React from "react";
import { createStyles } from "@mantine/core";
interface Props {
  className?: string;
}

const useStyles = createStyles((theme) => ({
  contentContainer: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
  },
}))

const ContentContainer: React.FC<Props> = ({ children, className }) => {
  const { classes } = useStyles();
  return (
    <div
      className={`border-gray-300 border-top border-bottom py-5 px-0 ${classes.contentContainer} ${className ? ` ${className}` : ""
        }`}
    >
      {children}
    </div>
  );
};
export default ContentContainer;
