import { Button, Modal } from "@mantine/core";
import React from "react";
interface ModalProps {
  isOpen: boolean;
  toggle: () => void;
  setHidden: () => void;
}
const HideAnswerSectionModal: React.FC<ModalProps> = ({
  isOpen,
  toggle,
  setHidden,
}) => {
  return (
    <Modal size="lg" opened={isOpen} title="Hide section?" onClose={toggle}>
      <Modal.Body>
        <p>All corresponding answers will be deleted, this cannot be undone!</p>

        <div className="text-right">
          <Button className="mt-1 mr-1" onClick={toggle}>
            Cancel
          </Button>
          <Button className="mt-1" color="red" onClick={setHidden}>
            Delete Answers
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
export default HideAnswerSectionModal;
