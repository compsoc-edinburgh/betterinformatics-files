import {
    Button,
    Modal,
    ModalBody,
    ModalHeader,
    Row,
  } from "@vseth/components";
  import React from "react";
  interface ModalProps {
    isOpen: boolean;
    toggle: () => void;
    closeWithImage: (image: string) => void;
  }
  const HideAnswersModal: React.FC<ModalProps> = ({
    isOpen,
    toggle,
  }) => {
    return (
      <Modal size="lg" isOpen={isOpen} toggle={toggle}>
        <ModalHeader toggle={toggle}>Hide Answers?</ModalHeader>
        <ModalBody>
          <Row>
            All corresponding Answers will be deleted, this cannot be undone!
          </Row>
  
          <div className="text-right">
            <Button className="mt-1 mr-1" onClick={() => isOpen = false}>
              Cancel
            </Button>
            <Button
              className="mt-1"
              color="danger"
              onClick={() => console.log("DELETE")}
            >
              Delete Answers
            </Button>
          </div>
        </ModalBody>
      </Modal>
    );
  };
  export default HideAnswersModal;
  