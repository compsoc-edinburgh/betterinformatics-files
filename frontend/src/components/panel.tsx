import { css, cx } from "@emotion/css";
import { Button } from "@mantine/core";
import React, { CSSProperties } from "react";
import Transition from "react-transition-group/Transition";
import { Icon, ICONS } from "vseth-canine-ui";
import GlobalConsts from "../globalconsts";

const panelStyle = css`
  pointer-events: none;
  position: fixed;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  padding: 3.5em 0 3.5em 0;
  z-index: ${GlobalConsts.zIndex.panel};
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
  pointer-events: all;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
`;
const modalWrapper = css`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
`;
const modalStyle = css`
  position: relative;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  background-clip: padding-box;
  background: #fff;
  padding: 1em;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-top-left-radius: 0.3rem;
  outline: 0;
  max-height: 100%;
  overflow: auto;
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

const transitionStyles = {
  entering: { transform: "translate(0)" },
  entered: { transform: "translate(0)" },
  exiting: { transform: "translate(100%)" },
  exited: { transform: "translate(100%)" },
  unmounted: { transform: "translate(100%)" },
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
            variant="brand"
            className={closeButtonStyle}
            onClick={toggle}
            leftIcon={<Icon icon={ICONS.ARROW_LEFT} size={24} />}
          >
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
                variant="brand"
                className={closeButtonStyle}
                onClick={toggle}
              >
                <Icon icon={ICONS.CLOSE} size={24} />
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
