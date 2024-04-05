import { Button } from "@mantine/core";
import React, { CSSProperties } from "react";
import Transition from "react-transition-group/Transition";
import { IconArrowLeft, IconX } from "@tabler/icons-react";
import clsx from "clsx";
import classes from "./panel.module.css";

interface PanelProps {
  isOpen: boolean;
  toggle: () => void;
  iconPadding?: CSSProperties["padding"];
  buttonText?: string;
  children?: React.ReactNode;
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
      <div className={classes.panel}>
        <div className={classes.iconContainer} style={{ padding: iconPadding }}>
          <Button
            size="lg"
            className={classes.closeButton}
            onClick={toggle}
            leftSection={
              <IconArrowLeft style={{ height: "24px", width: "24px" }} />
            }
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
            className={classes.panel}
            style={{
              ...transitionStyles[state as keyof typeof transitionStyles],
            }}
          >
            <div
              className={classes.iconContainer}
              style={{ padding: iconPadding }}
            >
              <Button
                size="lg"
                className={classes.closeButton}
                onClick={toggle}
              >
                <IconX style={{ height: "24px", width: "24px" }} />
                {buttonText && (
                  <div>
                    <small>{buttonText}</small>
                  </div>
                )}
              </Button>
            </div>
            <div className={classes.modalWrapper}>
              <div className={clsx("modal-content", classes.modal)}>
                {children}
              </div>
            </div>
          </div>
        )}
      </Transition>
    </>
  );
};
export default Panel;
