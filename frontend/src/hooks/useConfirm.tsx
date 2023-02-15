import React, { useState, useCallback } from "react";
import { Modal, ModalBody, ModalFooter } from "@vseth/components";
import { Button } from "@mantine/core";
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
    <Modal isOpen={true} key={i + message}>
      <ModalBody>{message}</ModalBody>
      <ModalFooter>
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
      </ModalFooter>
    </Modal>
  ));
  return [push, modals] as const;
};
export default useConfirm;
