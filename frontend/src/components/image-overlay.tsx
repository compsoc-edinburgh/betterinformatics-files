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
import useSet from "../hooks/useSet";
import FileInput from "./file-input";
import {
  removeImage,
  useListImages,
  useUploadImage,
} from "../api/hooks/images";

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
  const [selected, select, unselect, setSelected] = useSet<string>();
  useEffect(() => setSelected(), [setSelected]);
  const [file, setFile] = useState<File | undefined>(undefined);
  const removeSelected = async () => {
    for (const image of selected) {
      await removeImage(image);
    }
    setSelected();
    await images.refetch();
  };

  const images = useListImages({
    query: {
      select(data) {
        return data.value;
      },
    },
  });

  const uploadImage = useUploadImage({
    mutation: {
      onSuccess() {
        images.refetch();
      },
    },
  });

  return (
    <Modal title="Images" size="lg" opened={isOpen} onClose={onClose}>
      <Modal.Body>
        <FileInput value={file} onChange={setFile} accept="image/*" />
        <Group mt="sm">
          <Button
            onClick={() => {
              if (file) {
                uploadImage.mutate({
                  data: {
                    file,
                  },
                });
                setFile(undefined);
              }
            }}
            disabled={file === undefined}
          >
            Upload
          </Button>
          <Button
            onClick={() => {
              void images.refetch();
            }}
          >
            Reload
          </Button>
          <Button
            color="red"
            disabled={selected.size === 0}
            onClick={removeSelected}
          >
            Delete selected
          </Button>
        </Group>

        <SimpleGrid cols={3} mt="sm">
          {images.data?.map(image => (
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
                  <Button pos="absolute" onClick={() => closeWithImage(image)}>
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
