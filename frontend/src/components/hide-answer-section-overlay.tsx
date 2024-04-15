import { Button, Modal } from "@mantine/core";
import React from "react";
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  setHidden: () => void;
}
const HideAnswerSectionModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  setHidden,
}) => {
  return (
    <Modal size="lg" opened={isOpen} title="Hide section?" onClose={onClose}>
      <Modal.Body>
        <p>All corresponding answers will be deleted, this cannot be undone!</p>

        <div>
          <Button onClick={onClose}>Cancel</Button>
          <Button color="red" onClick={setHidden}>
            Delete Answers
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
export default HideAnswerSectionModal;
