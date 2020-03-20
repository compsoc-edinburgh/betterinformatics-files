import React, { useState, useCallback } from "react";
import { Modal, ModalBody, ModalFooter, Button } from "@vseth/components";
type CB = () => void;
const useConfirm = () => {
  const [stack, setStack] = useState<Array<[string, CB, CB]>>([]);
  const push = useCallback((message: string, yes: CB, no?: CB) => {
    setStack(prevStack => [...prevStack, [message, yes, no || (() => {})]]);
  }, []);
  const pop = useCallback(() => {
    setStack(prevStack => prevStack.slice(0, prevStack.length - 1));
  }, []);
  const modals = stack.map(([message, yes, no]) => (
    <Modal isOpen={true}>
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
