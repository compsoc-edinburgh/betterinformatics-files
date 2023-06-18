import React from "react";
import { DebugOptions } from ".";
import { Checkbox, Modal, Stack } from "@mantine/core";
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
    <Modal opened={isOpen} title="Debug" onClose={toggle}>
      <Stack spacing="sm">
        <Checkbox
          label="Display all tooltips"
          checked={debugOptions.displayAllTooltips}
          onChange={e =>
            setDebugOptions({
              ...debugOptions,
              displayAllTooltips: e.currentTarget.checked,
            })
          }
        />
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
