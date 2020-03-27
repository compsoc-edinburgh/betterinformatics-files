import { useSize } from "@umijs/hooks";
import { Button, Icon, ICONS } from "@vseth/components";
import { css, cx } from "emotion";
import React from "react";
const panelStyle = css`
  position: fixed;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  padding: 3.5em 0;
  z-index: 5000;
  max-width: 500px;
  max-height: 100%;
  box-sizing: border-box;
  overflow-y: scroll;
  transition: transform 0.5s;
`;
const iconContainerStyle = css`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1em 0;
`;
const closeButtonStyle = css`
  &.btn {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
`;
const modalStyle = css`
  &.modal-content {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
`;
interface PanelProps {
  isOpen: boolean;
  toggle: () => void;
}
const Panel: React.FC<PanelProps> = ({ children, isOpen, toggle }) => {
  const [size, ref] = useSize<HTMLDivElement>();
  return (
    <div
      className={panelStyle}
      style={{
        transform: isOpen
          ? `translateX(0px)`
          : `translateX(${(size.width || 999999) + 10}px)`,
      }}
    >
      <div className={iconContainerStyle}>
        <Button
          size="lg"
          color="primary"
          className={closeButtonStyle}
          onClick={toggle}
        >
          <Icon icon={ICONS[isOpen ? "CLOSE" : "ARROW_LEFT"]} size={24} />
        </Button>
      </div>
      <div ref={ref}>
        <div className={cx("modal-content", modalStyle)}>{children}</div>
      </div>
    </div>
  );
};
export default Panel;
