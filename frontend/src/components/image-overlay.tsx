import { Button, Card, Grid, Image, Modal, SimpleGrid } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { useImages } from "../api/image";
import useSet from "../hooks/useSet";
import FileInput from "./file-input";
import { css } from "@emotion/css";
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
    <Modal title="Images" size="lg" opened={isOpen} onClose={toggle}>
      <Modal.Body>
        <Grid>
          <Grid.Col>
            <FileInput value={file} onChange={setFile} accept="image/*" />
          </Grid.Col>
          <Grid.Col xs="auto">
            <Button
              onClick={() => {
                if (file) {
                  add(file);
                  setFile(undefined);
                }
              }}
              disabled={file === undefined}
            >
              Upload
            </Button>
          </Grid.Col>
        </Grid>

        <div className="text-right">
          <Button className="mt-1 mr-1" onClick={reload}>
            Reload
          </Button>
          <Button
            className="mt-1"
            color="red"
            disabled={selected.size === 0}
            onClick={removeSelected}
          >
            Delete selected
          </Button>
        </div>

        <SimpleGrid cols={3}>
          {images &&
            images.map(image => (
              <div key={image} className={cardWrapperStyle}>
                <Card
                  className="p-2"
                  color={selected.has(image) ? "primary" : undefined}
                  onClick={e =>
                    e.metaKey
                      ? selected.has(image)
                        ? unselect(image)
                        : select(image)
                      : selected.has(image)
                      ? setSelected()
                      : setSelected(image)
                  }
                >
                  <Card.Section>
                    <Image src={`/api/image/get/${image}/`} alt={image} />
                  </Card.Section>
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
        </SimpleGrid>
      </Modal.Body>
    </Modal>
  );
};
export default ImageModal;
