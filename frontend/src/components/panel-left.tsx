import { css, cx } from "@emotion/css";
import { ArrowRightIcon, Button, CloseIcon } from "@vseth/components";
import React, { CSSProperties } from "react";
import Transition from "react-transition-group/Transition";
import GlobalConsts from "../globalconsts";

const panelStyle = css`
  pointer-events: none;
  position: fixed;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: row;
  padding: 3.5em 0 3.5em 0;
  z-index: ${GlobalConsts.zIndex.panel};
  max-width: 500px;
  height: 100%;
  box-sizing: border-box;
  transition: transform 0.5s;
  @media (max-width: 1199.98px) {
    padding-top: 0px;
  }
  @media (min-width: 1200px) {
    padding-top: 7rem;
    padding-bottom: 0px;
  }
`;
const iconContainerStyle = css`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;
const closeButtonStyle = css`
  display: inline-block;
  font-size: 0.5em;
  pointer-events: all;
  &.btn {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
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
  height: 100%;
  overflow: auto;
  &.modal-content {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  & .modal-header {
    display: block;
  }
`;
interface PanelProps {
  header: string;
  isOpen: boolean;
  toggle: () => void;
  iconPadding?: CSSProperties["padding"];
  buttonText?: string;
}

const duration = 200;

const transitionStyles = {
  entering: { transform: "translate(0)" },
  entered: { transform: "translate(0)" },
  exiting: { transform: "translate(-100%)" },
  exited: { transform: "translate(-100%)" },
  unmounted: { transform: "translate(-100%)" },
};

const Panel: React.FC<PanelProps> = ({
  header,
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
            <ArrowRightIcon size={24} />
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
            className={`${panelStyle}`}
            style={{
              ...transitionStyles[state],
            }}
          >
            <div className={modalWrapper}>
              <div className={`${cx("modal-content", modalStyle)} p-4`}>
                <h3>{header}</h3>
                {children}
              </div>
            </div>
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
                <CloseIcon size={24} />
                {buttonText && (
                  <div>
                    <small>{buttonText}</small>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </Transition>
    </>
  );
};
export default Panel;
