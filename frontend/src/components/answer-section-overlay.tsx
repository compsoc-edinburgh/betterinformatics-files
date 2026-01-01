import { Button, Flex, Modal, Text } from "@mantine/core";
import React from "react";
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  setHidden: () => void;
  title: string;
  text: string;
  button: string;
}
const AnswerSectionModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  setHidden,
  title,
  text,
  button,
}) => {
  return (
    <Modal size="lg" opened={isOpen} title={title} onClose={onClose}>
      <Modal.Body>
        <Text c="red">{text}</Text>
        <Flex gap={"sm"} mt={"md"}>
          <Button color="red" onClick={setHidden}>
            {button}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </Flex>
      </Modal.Body>
    </Modal>
  );
};
export default AnswerSectionModal;
