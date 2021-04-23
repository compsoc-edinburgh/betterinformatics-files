import {
  Button,
  Card,
  CardColumns,
  CardImg,
  Modal,
  ModalBody,
  ModalHeader,
  Row,
  Col,
} from "@vseth/components";
import React, { useEffect, useState } from "react";
import { useImages } from "../api/image";
import useSet from "../hooks/useSet";
import FileInput from "./file-input";
import IconButton from "./icon-button";
import { css } from "@emotion/css";
const columnStyle = css`
  column-gap: 0;
  grid-column-gap: 0;
  margin: 0 -0.75em;
  padding-top: 1em;
`;
const cardWrapperStyle = css`
  padding: 0 0.75em;
`;
interface ModalProps {
  isOpen: boolean;
  toggle: () => void;
  closeWithImage: (image: string) => void;
}
const ImageModal: React.FC<ModalProps> = ({
  isOpen,
  toggle,
  closeWithImage,
}) => {
  const { images, add, remove, reload } = useImages();
  const [selected, select, unselect, setSelected] = useSet<string>();
  useEffect(() => setSelected(), [images, setSelected]);
  const [file, setFile] = useState<File | undefined>(undefined);
  const removeSelected = () => {
    for (const image of selected) {
      remove(image);
    }
  };
  return (
    <Modal size="lg" isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Images</ModalHeader>
      <ModalBody>
        <Row>
          <Col>
            <FileInput value={file} onChange={setFile} accept="image/*" />
          </Col>
          <Col xs="auto">
            <Button
              onClick={() => file && add(file) && setFile(undefined)}
              disabled={file === undefined}
            >
              Upload
            </Button>
          </Col>
        </Row>

        <div className="text-right">
          <Button className="mt-1 mr-1" onClick={reload}>
            Reload
          </Button>
          <Button
            className="mt-1"
            color="danger"
            disabled={selected.size === 0}
            onClick={removeSelected}
          >
            Delete selected
          </Button>
        </div>

        <CardColumns className={columnStyle}>
          {images &&
            images.map((image) => (
              <div key={image} className={cardWrapperStyle}>
                <Card
                  className="p-2"
                  color={selected.has(image) ? "primary" : undefined}
                  onClick={(e) =>
                    e.metaKey
                      ? selected.has(image)
                        ? unselect(image)
                        : select(image)
                      : selected.has(image)
                      ? setSelected()
                      : setSelected(image)
                  }
                >
                  <CardImg
                    width="100%"
                    src={`/api/image/get/${image}/`}
                    alt={image}
                  />
                  {selected.has(image) && selected.size === 1 && (
                    <div className="position-absolute position-bottom-right">
                      <Button
                        color="primary"
                        onClick={() => closeWithImage(image)}
                      >
                        Insert
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            ))}
        </CardColumns>
      </ModalBody>
    </Modal>
  );
};
export default ImageModal;
