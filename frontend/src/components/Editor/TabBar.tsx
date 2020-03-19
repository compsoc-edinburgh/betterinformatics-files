import * as React from "react";
import { css, cx } from "emotion";

const buttonStyle = css`
  border: none;
  background-color: transparent;
  cursor: pointer;
  padding: 0.4em;
  font-weight: 400;
  font-size: 14px;
  margin: 0;
  color: rgba(0, 0, 0, 0.5);
  transition: color 0.1s, border-bottom 0.1s;
  border-radius: 0;
  &:hover {
    background-color: transparent;
  }
`;
const inactiveButtonStyle = css`
  border-bottom: 1px solid transparent;
  &:hover {
    color: rgba(0, 0, 0, 0.9);
    border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  }
`;
const activeButtonStyle = css`
  color: rgba(0, 0, 0, 1);
  border-bottom: 1px solid #3867d6;
`;

interface Item {
  title: string;
  active: boolean;
  onClick: () => void;
}
interface Props {
  items: Item[];
}
const TabBar: React.FC<Props> = ({ items }) => {
  return (
    <div>
      {items.map(item => (
        <button
          key={item.title}
          onClick={item.onClick}
          className={cx(
            buttonStyle,
            item.active ? activeButtonStyle : inactiveButtonStyle,
          )}
        >
          {item.title}
        </button>
      ))}
    </div>
  );
};
export default TabBar;
