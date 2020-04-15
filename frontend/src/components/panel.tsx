import { Button, Icon, ICONS } from "@vseth/components";
import { css, cx, keyframes } from "emotion";
import React, { CSSProperties } from "react";
import Transition from "react-transition-group/Transition";
const panelStyle = css`
  position: fixed;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  padding: 3.5em 0 3.5em 0;
  z-index: 100;
  max-width: 500px;
  height: 100%;
  box-sizing: border-box;
  transition: transform 0.5s;
`;
const iconContainerStyle = css`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;
const closeButtonStyle = css`
  display: inline-block;
  font-size: 0.5em;
  &.btn {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
`;
const modalWrapper = css`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
`;
const modalStyle = css`
  max-height: 100%;
  overflow: scroll;
  &.modal-content {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  & .modal-header {
    display: block;
  }
`;
interface PanelProps {
  isOpen: boolean;
  toggle: () => void;
  iconPadding?: CSSProperties["padding"];
  buttonText?: string;
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

const Panel: React.FC<PanelProps> = ({
  children,
  isOpen,
  toggle,
  iconPadding = "1em 0",
  buttonText,
}) => {
  return (
    <>
      <div className={panelStyle}>
        <div className={iconContainerStyle} style={{ padding: iconPadding }}>
          <Button
            size="lg"
            color="primary"
            className={closeButtonStyle}
            onClick={toggle}
          >
            <Icon icon={ICONS["ARROW_LEFT"]} size={24} />
            {buttonText && (
              <div>
                <small>{buttonText}</small>
              </div>
            )}
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
            <div
              className={iconContainerStyle}
              style={{ padding: iconPadding }}
            >
              <Button
                size="lg"
                color="primary"
                className={closeButtonStyle}
                onClick={toggle}
              >
                <Icon icon={ICONS["CLOSE"]} size={24} />
                {buttonText && (
                  <div>
                    <small>{buttonText}</small>
                  </div>
                )}
              </Button>
            </div>
            <div className={modalWrapper}>
              <div className={cx("modal-content", modalStyle)}>{children}</div>
            </div>
          </div>
        )}
      </Transition>
    </>
  );
};
export default Panel;
