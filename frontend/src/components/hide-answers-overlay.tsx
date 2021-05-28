import { Button, Modal, ModalBody, ModalHeader, Row } from "@vseth/components";
import React from "react";
interface ModalProps {
  isOpen: boolean;
  toggle: () => void;
  setHidden: () => void;
}
const HideAnswersModal: React.FC<ModalProps> = ({
  isOpen,
  toggle,
  setHidden,
}) => {
  return (
    <Modal size="lg" isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Hide Section?</ModalHeader>
      <ModalBody>
        <p>All corresponding answers will be deleted, this cannot be undone!</p>

        <div className="text-right">
          <Button className="mt-1 mr-1" onClick={toggle}>
            Cancel
          </Button>
          <Button className="mt-1" color="danger" onClick={setHidden}>
            Delete Answers
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
};
export default HideAnswersModal;
