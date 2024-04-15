import {
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  Group,
  Modal,
  TextInput,
  Title,
} from "@mantine/core";
import React, { useState } from "react";
import {
  Mutate,
  useDeleteDocumentFile,
  useUpdateDocumentFile,
} from "../api/hooks";
import { Document, DocumentFile } from "../interfaces";
import FileInput from "./file-input";
import IconButton from "./icon-button";
import {
  IconDeviceFloppy,
  IconEdit,
  IconKey,
  IconTrash,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";

interface Props {
  document: Document;
  file: DocumentFile;
  mutate: Mutate<Document>;
}

const DocumentFileItem: React.FC<Props> = ({ file, document, mutate }) => {
  const [displayName, setDisplayName] = useState<string | undefined>();
  const [replaceFile, setFile] = useState<File | undefined>(undefined);

  const [deleteLoading, deleteFile] = useDeleteDocumentFile(
    document.author,
    document.slug,
    file.oid,
    () => {
      mutate(s => ({
        ...s,
        files: s.files.filter(f => f.oid !== file.oid),
      }));
    },
  );
  const [updateLoading, updateFile] = useUpdateDocumentFile(
    document.author,
    document.slug,
    file.oid,
    file => {
      setDisplayName(undefined);
      setFile(undefined);
      mutate(s => ({
        ...s,
        files: s.files.map(f => (f.oid !== file.oid ? f : file)),
      }));
      closeEditModal();
    },
  );
  const [editIsOpen, {toggle: toggleEditIsOpen, close: closeEditModal}] = useDisclosure();
  const [keyIsOpen, {toggle: toggleKeyIsOpen, close: closeKeyModal}] = useDisclosure();
  return (
    <>
      <Modal
        title="Edit {file.display_name}"
        onClose={closeEditModal}
        opened={editIsOpen}
      >
        <Modal.Body>
          <TextInput
            label="Display Name"
            value={displayName ?? file.display_name}
            onChange={e => setDisplayName(e.currentTarget.value)}
          />
          <label>Replace File</label>
          <FileInput
            value={replaceFile}
            onChange={setFile}
            accept=".pdf,.tex,.md,.txt,.zip,.apkg,.colpkg" // apkg=anki
          />
          <Button
            disabled={displayName?.trim() === ""}
            onClick={() =>
              updateFile({
                display_name: displayName?.trim(),
                file: replaceFile,
              })
            }
            leftSection={<IconDeviceFloppy />}
            loading={updateLoading}
          >
            Save
          </Button>
        </Modal.Body>
      </Modal>
      <Modal
        title="Access Token"
        onClose={closeKeyModal}
        opened={keyIsOpen}
        size="lg"
      >
        <Modal.Body>
          <p>
            Token: <code>{document.api_key}</code>
          </p>
          <p>
            This token can be used to replace any file of this document without
            needing to login manually. You could for example use it in a GitLab
            / Github CI script to update the files whenever you push changes to
            a git repository.
          </p>
          <p>
            The token is valid for an endpoint that can be found at{" "}
            <code>
              {
                "POST /api/document/<str:username>/<str:document_slug>/files/<int:id>/update/"
              }
            </code>
            . The token has to be supplied as an Authorization header, a
            replacement file can be sent as multipart-form upload with the key
            "file". The content type and filename of the new file are ignored,
            the extension and the filename won't change.
          </p>
          <p>
            The token shouldn't be made public - you should always store it in a
            secret and hand it over to scripts using an environment variable.
          </p>
          <p>
            With <code>curl</code> this file could be replaced with the
            following command assuming that the new file is located in the
            current working directory and named "my_document.pdf".
          </p>
          <pre>
            <code>
              {`curl ${window.location.origin}/api/document/${document.author}/${document.slug}/files/${file.oid}/update/ \\\n  -H "Authorization: ${document.api_key}" \\\n  -F "file=@my_document.pdf"`}
            </code>
          </pre>
        </Modal.Body>
      </Modal>
      <Card withBorder my="xs">
        <Flex justify="space-between" align="center">
          <Flex direction="column" gap="xs">
            <Title order={3}>{file.display_name || <i>Unnamed</i>}</Title>
            <Group>
              <Badge>{file.filename}</Badge>{" "}
              <Badge color="gray">{file.mime_type}</Badge>
            </Group>
          </Flex>
          <Grid>
            <Grid.Col span={{ xs: "auto" }}>
              <IconButton
                icon={<IconKey />}
                onClick={toggleKeyIsOpen}
                tooltip="View access token"
              />
            </Grid.Col>
            <Grid.Col span={{ xs: "auto" }}>
              <IconButton
                icon={<IconEdit />}
                onClick={toggleEditIsOpen}
                tooltip="Edit file"
              />
            </Grid.Col>
            <Grid.Col span={{ xs: "auto" }}>
              <IconButton
                icon={<IconTrash />}
                color="red"
                onClick={deleteFile}
                loading={deleteLoading}
                tooltip="Delete file"
              />
            </Grid.Col>
          </Grid>
        </Flex>
      </Card>
    </>
  );
};

export default DocumentFileItem;
