import React, { useState, useCallback } from "react";
import { Modal, Button } from "@mantine/core";
type CB = () => void;
const useConfirm = () => {
  const [stack, setStack] = useState<Array<[string, CB, CB]>>([]);
  const push = useCallback((message: string, yes: CB, no?: CB) => {
    setStack(prevStack => [...prevStack, [message, yes, no || (() => { })]]);
  }, []);
  const pop = useCallback(() => {
    setStack(prevStack => prevStack.slice(0, prevStack.length - 1));
  }, []);
  const modals = stack.map(([message, yes, no], i) => (
    <Modal opened={true} onClose={() => { }} key={i + message}>
      <Modal.Body>{message}</Modal.Body>
      <Button
        color="secondary"
        onClick={() => {
          pop();
          no();
        }}
      >
        Cancel
      </Button>
      <Button
        color="primary"
        onClick={() => {
          pop();
          yes();
        }}
      >
        Okay
      </Button>
    </Modal>
  ));
  return [push, modals] as const;
};
export default useConfirm;
