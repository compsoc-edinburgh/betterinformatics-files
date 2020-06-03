import { css } from "emotion";

export const focusOutline = css`
  cursor: pointer;
  &:focus {
    outline: 1.5px solid var(--gray-dark);
    outline-offset: 2px;
  }
`;
