import { Button, Icon, ICONS } from "@vseth/components";
import { css, cx, keyframes } from "emotion";
import React from "react";
import Transition from "react-transition-group/Transition";
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

const duration = 200;
const enteringAnimation = keyframes`
  0% {
    transform: translate(100%);
  }
  100% {
    transform: translate(0);
  }
`;
const exitingAnimation = keyframes`
0% {
  transform: translate(0);
  }
  100% {
    transform: translate(100%);
  }
`;

const transitionStyles = {
  entering: {
    animation: `${enteringAnimation} ${duration}ms cubic-bezier(0.45, 0, 0.55, 1)`,
  },
  entered: { transform: "" },
  exiting: {
    animation: `${exitingAnimation} ${duration}ms cubic-bezier(0.45, 0, 0.55, 1)`,
  },
  exited: { transform: "translate(100%)" },
};

const Panel: React.FC<PanelProps> = ({ children, isOpen, toggle }) => {
  return (
    <>
      <div className={panelStyle}>
        <div className={iconContainerStyle}>
          <Button
            size="lg"
            color="primary"
            className={closeButtonStyle}
            onClick={toggle}
          >
            <Icon icon={ICONS["ARROW_LEFT"]} size={24} />
          </Button>
        </div>
      </div>
      <Transition in={isOpen} timeout={duration} unmountOnExit>
        {state => (
          <div
            className={panelStyle}
            style={{
              ...transitionStyles[state as keyof typeof transitionStyles],
            }}
          >
            <div className={iconContainerStyle}>
              <Button
                size="lg"
                color="primary"
                className={closeButtonStyle}
                onClick={toggle}
              >
                <Icon icon={ICONS["CLOSE"]} size={24} />
              </Button>
            </div>
            <div>
              <div className={cx("modal-content", modalStyle)}>{children}</div>
            </div>
          </div>
        )}
      </Transition>
    </>
  );
};
export default Panel;
