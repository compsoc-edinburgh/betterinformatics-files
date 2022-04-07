import { css } from "@emotion/css";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalBody,
  ModalHeader,
} from "@vseth/components";
import * as React from "react";
import { useCallback, useState } from "react";
import { ImageHandle } from "./utils/types";

const rowStyle = css`
  text-align: right;
  margin-left: -0.5rem;
`;
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
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const toggleHelp = useCallback(() => setIsHelpOpen((prev) => !prev), []);
  return (
    <div>
      <div className={rowStyle}>
        <ButtonGroup>
          <Button size="sm" onClick={toggleHelp}>
            Help
          </Button>
          <Button size="sm" onClick={onOpenOverlay}>
            Browse Images
          </Button>
        </ButtonGroup>
      </div>
      <Modal isOpen={isHelpOpen} toggle={toggleHelp}>
        <ModalHeader>Help</ModalHeader>
        <ModalBody>
          You can use Markdown. Use <code>```lang \n code \n ```</code> for code
          blocks and <code>`code`</code> for inline code. Use{" "}
          <code>$ math $</code> or <code>$$ \n math \n $$</code> for latex math.
        </ModalBody>
      </Modal>
    </div>
  );
};
export default EditorFooter;
