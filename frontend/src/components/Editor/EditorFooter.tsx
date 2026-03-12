import { Button, Group, Modal } from "@mantine/core";
import * as React from "react";
import { ImageHandle } from "./utils/types";
import EditorHelp from "./EditorHelp";
import classes from "./EditorFooter.module.css";
import { useDisclosure } from "@mantine/hooks";

interface Props {
  onOpenOverlay: () => void;
  attachments: ImageHandle[];
  onDelete: (handle: ImageHandle) => void;
}
const EditorFooter: React.FC<Props> = ({
  attachments,
  onDelete,
  onOpenOverlay,
}) => {
  const [isHelpOpen, { toggle: toggleHelpModal, close: closeHelpModal }] =
    useDisclosure();
  return (
    //onClick handler to prevent a bug where users are unable to select the text in the
    //"supported function popup" (see issue #368). This propagation stop prevents the
    //click event from reaching
    //[this line](https://gitlab.ethz.ch/vseth/sip-com-apps/community-solutions/-/blob/7a13163c85174e1cecc48e4689dc9301ba0197ab/frontend/src/components/Editor/index.tsx#L361)
    //which is probably responsible.
    <div onClick={e => e.stopPropagation()}>
      <Group justify="right" className={classes.row}>
        <Button.Group>
          <Button variant="default" size="sm" onClick={toggleHelpModal}>
            Supported Functions
          </Button>
          <Button variant="default" size="sm" onClick={onOpenOverlay}>
            Browse Images
          </Button>
        </Button.Group>
      </Group>
      <Modal
        title="Help with Editor"
        opened={isHelpOpen}
        onClose={closeHelpModal}
        size="min(90vw, 1500px)"
      >
        <Modal.Body>
          <EditorHelp />
        </Modal.Body>
      </Modal>
    </div>
  );
};
export default EditorFooter;
