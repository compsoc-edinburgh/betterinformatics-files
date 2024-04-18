import React from "react";
import { DebugOptions } from ".";
import { Checkbox, Modal, Stack } from "@mantine/core";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  debugOptions: DebugOptions;
  setDebugOptions: (newOptions: DebugOptions) => void;
}
const DebugModal: React.FC<Props> = ({
  isOpen,
  onClose,
  debugOptions,
  setDebugOptions,
}) => {
  return (
    <Modal opened={isOpen} title="Debug" onClose={onClose}>
      <Stack gap="sm">
        <Checkbox
          label="Display canvas debugging indicators"
          checked={debugOptions.displayCanvasType}
          onChange={e =>
            setDebugOptions({
              ...debugOptions,
              displayCanvasType: e.currentTarget.checked,
            })
          }
        />
        <Checkbox
          label="Display snap regions"
          checked={debugOptions.viewOptimalCutAreas}
          onChange={e =>
            setDebugOptions({
              ...debugOptions,
              viewOptimalCutAreas: e.currentTarget.checked,
            })
          }
        />
      </Stack>
    </Modal>
  );
};
export default DebugModal;
