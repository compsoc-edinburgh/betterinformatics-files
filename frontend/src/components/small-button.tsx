import { css } from "@emotion/css";
import TooltipButton, { TooltipButtonProps } from "./TooltipButton";

const small = css`
  min-width: 0;
`;

const SmallButton = ({ className, ...props }: TooltipButtonProps) => (
  <TooltipButton
    className={className ? `${className} ${small}` : small}
    px="xs"
    {...props}
  />
);

export default SmallButton;
