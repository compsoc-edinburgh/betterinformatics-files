import {
  Button,
  Card,
  Center,
  Group,
  Image,
  Modal,
  SimpleGrid,
} from "@mantine/core";
import React, { useEffect, useState } from "react";
import { useImages } from "../api/image";
import useSet from "../hooks/useSet";
import FileInput from "./file-input";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  closeWithImage: (image: string) => void;
}
const ImageModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
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
    <Modal title="Images" size="lg" opened={isOpen} onClose={onClose}>
      <Modal.Body>
        <FileInput value={file} onChange={setFile} accept="image/*" />
        <Group mt="sm">
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
          <Button onClick={reload}>Reload</Button>
          <Button
            color="red"
            disabled={selected.size === 0}
            onClick={removeSelected}
          >
            Delete selected
          </Button>
        </Group>

        <SimpleGrid cols={3} mt="sm">
          {images &&
            images.map(image => (
              <div key={image} style={{ padding: "0 0.75em" }}>
                <Card
                  color={selected.has(image) ? "primary" : undefined}
                  style={{
                    border: selected.has(image) ? "5px solid black" : "",
                  }}
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
                </Card>
                <Center>
                  {selected.has(image) && selected.size === 1 && (
                    <Button
                      pos="absolute"
                      onClick={() => closeWithImage(image)}
                    >
                      Insert
                    </Button>
                  )}
                </Center>
              </div>
            ))}
        </SimpleGrid>
      </Modal.Body>
    </Modal>
  );
};
export default ImageModal;
