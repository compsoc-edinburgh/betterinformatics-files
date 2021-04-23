import { css } from "@emotion/css";
import TooltipButton, { TooltipButtonProps } from "./TooltipButton";

const small = css`
  min-width: 0;
`;

const SmallButton = (props: TooltipButtonProps) => (
  <TooltipButton className={small} {...props} />
);

export default SmallButton;
