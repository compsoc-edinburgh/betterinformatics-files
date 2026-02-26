import React, { useState, useCallback } from "react";
import { Modal, Button, Group, ButtonProps } from "@mantine/core";

interface ButtonPropsOverride {
  propsDict: Partial<ButtonProps>;
  label: string;
}

type CB = () => void;
const useConfirm = () => {
  const [stack, setStack] = useState<
    Array<[string, CB, CB, ButtonPropsOverride, ButtonPropsOverride]>
  >([]);
  const push = useCallback(
    (
      message: string,
      yes: CB,
      no?: CB,
      yesButtonOverrride?: ButtonPropsOverride,
      noButtonOverride?: ButtonPropsOverride,
    ) => {
      setStack(prevStack => [
        ...prevStack,
        [
          message,
          yes,
          no || (() => {}),
          yesButtonOverrride || {
            label: "Okay",
            propsDict: { variant: "outline" },
          },
          noButtonOverride || { label: "Cancel", propsDict: {} },
        ],
      ]);
    },
    [],
  );
  const pop = useCallback(() => {
    setStack(prevStack => prevStack.slice(0, prevStack.length - 1));
  }, []);
  const modals = stack.map(
    ([message, yes, no, yesButtonOverrride, noButtonOverride], i) => (
      <Modal
        opened={true}
        withCloseButton={false}
        onClose={() => {}}
        key={i + message}
      >
        <Modal.Body mt="sm">{message}</Modal.Body>

        <Group justify="right">
          <Button
            {...noButtonOverride.propsDict}
            onClick={() => {
              pop();
              no();
            }}
          >
            {noButtonOverride.label}
          </Button>
          <Button
            {...yesButtonOverrride.propsDict}
            onClick={() => {
              pop();
              yes();
            }}
          >
            {yesButtonOverrride.label}
          </Button>
        </Group>
      </Modal>
    ),
  );
  return [push, modals] as const;
};
export default useConfirm;
