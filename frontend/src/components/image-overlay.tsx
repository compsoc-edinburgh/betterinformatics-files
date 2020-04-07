import { useRequest } from "@umijs/hooks";
import {
  Button,
  Card,
  CardColumns,
  CardImg,
  Modal,
  ModalBody,
  ModalHeader,
} from "@vseth/components";
import React, { useState } from "react";
import { fetchGet, fetchPost } from "../api/fetch-utils";
import useSet from "../hooks/useSet";
import FileInput from "./file-input";
import TwoButtons from "./two-buttons";

const loadImage = async () => {
  return (await fetchGet("/api/image/list/")).value as string[];
};
const removeImage = async (image: string) => {
  await fetchPost(`/api/image/remove/${image}/`, {});
  return image;
};
const uploadImage = async (file: File) => {
  return (await fetchPost("/api/image/upload/", { file })).filename as string;
};

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
  const [file, setFile] = useState<File | undefined>(undefined);
  const { data: images, mutate, run: reload } = useRequest(loadImage, {
    cacheKey: "images",
  });
  const [selected, add, remove, setSelected] = useSet<string>();
  const { run: runRemoveImage } = useRequest(removeImage, {
    manual: true,
    fetchKey: id => id,
    onSuccess: removed => {
      mutate(prev => prev.filter(image => image !== removed));
      remove(removed);
    },
  });
  const { run: runUploadImage } = useRequest(uploadImage, {
    manual: true,
    onSuccess: added => {
      mutate(prevSelected => [...prevSelected, added]);
      setFile(undefined);
    },
  });
  const removeSelected = () => {
    for (const image of selected) {
      runRemoveImage(image);
    }
  };
  return (
    <Modal size="lg" isOpen={isOpen} toggle={toggle}>
      <ModalHeader>Images</ModalHeader>
      <ModalBody>
        <TwoButtons
          fill="left"
          left={<FileInput value={file} onChange={setFile} accept="image/*" />}
          right={
            <Button
              onClick={() => file && runUploadImage(file)}
              disabled={file === undefined}
            >
              Upload
            </Button>
          }
        />

        <TwoButtons
          right={
            <>
              <Button style={{ marginTop: "1em" }} onClick={reload}>
                Reload
              </Button>
              <Button
                style={{ marginTop: "1em" }}
                color="danger"
                disabled={selected.size === 0}
                onClick={removeSelected}
              >
                Delete selected
              </Button>
            </>
          }
        />

        <CardColumns
          style={{
            columnGap: 0,
            gridColumnGap: 0,
            margin: "0 -12px",
            paddingTop: "1em",
          }}
        >
          {images &&
            images.map(image => (
              <div key={image} style={{ padding: "0 12px" }}>
                <Card
                  style={{
                    padding: "3px",
                    position: "relative",
                  }}
                  color={selected.has(image) ? "primary" : undefined}
                  onClick={e =>
                    e.metaKey
                      ? selected.has(image)
                        ? remove(image)
                        : add(image)
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
                    <div style={{ position: "absolute", bottom: 0, right: 0 }}>
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
