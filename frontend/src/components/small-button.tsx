import TooltipButton, { TooltipButtonProps } from "./TooltipButton";
import classes from "./small-button.module.css";
import clsx from "clsx";

const SmallButton = ({ className, ...props }: TooltipButtonProps) => (
  <TooltipButton
    className={clsx(className && className, classes.small)}
    px="xs"
    {...props}
  />
);

export default SmallButton;
