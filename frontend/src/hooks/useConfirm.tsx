import React, { useState, useCallback } from "react";
import { Modal, Button, Group } from "@mantine/core";
type CB = () => void;
const useConfirm = () => {
  const [stack, setStack] = useState<Array<[string, CB, CB]>>([]);
  const push = useCallback((message: string, yes: CB, no?: CB) => {
    setStack(prevStack => [...prevStack, [message, yes, no || (() => {})]]);
  }, []);
  const pop = useCallback(() => {
    setStack(prevStack => prevStack.slice(0, prevStack.length - 1));
  }, []);
  const modals = stack.map(([message, yes, no], i) => (
    <Modal
      opened={true}
      withCloseButton={false}
      onClose={() => {}}
      key={i + message}
    >
      <Modal.Body mt="sm">{message}</Modal.Body>

      <Group justify="right">
        <Button
          onClick={() => {
            pop();
            no();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            pop();
            yes();
          }}
        >
          Okay
        </Button>
      </Group>
    </Modal>
  ));
  return [push, modals] as const;
};
export default useConfirm;
