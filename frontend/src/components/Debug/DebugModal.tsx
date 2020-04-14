import React from "react";
import { DebugOptions } from ".";
import { Modal, ModalHeader, ModalBody, InputField } from "@vseth/components";
interface Props {
  isOpen: boolean;
  toggle: () => void;
  debugOptions: DebugOptions;
  setDebugOptions: (newOptions: DebugOptions) => void;
}
const DebugModal: React.FC<Props> = ({
  isOpen,
  toggle,
  debugOptions,
  setDebugOptions,
}) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader>Debug</ModalHeader>
      <ModalBody>
        <InputField
          type="checkbox"
          label="Display all tooltips"
          checked={debugOptions.displayAllTooltips}
          onChange={e =>
            setDebugOptions({
              ...debugOptions,
              displayAllTooltips: e.currentTarget.checked,
            })
          }
        />
        <InputField
          type="checkbox"
          label="Display canvas debugging indicators"
          checked={debugOptions.displayCanvasType}
          onChange={e =>
            setDebugOptions({
              ...debugOptions,
              displayCanvasType: e.currentTarget.checked,
            })
          }
        />
      </ModalBody>
    </Modal>
  );
};
export default DebugModal;
