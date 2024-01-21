import { Alert, Button, FileInput, Stack, TextInput } from "@mantine/core";
import * as React from "react";
import { useState } from "react";
import { Icon, ICONS } from "vseth-canine-ui";
import { NamedBlob } from "../api/fetch-utils";
import { Mutate, useCreateDocumentFile } from "../api/hooks";
import { Toggle } from "../hooks/useToggle";
import { Document } from "../interfaces";

interface Props {
  document: Document;
  toggle: Toggle;
  mutate: Mutate<Document>;
}

const CreateDocumentFileModal: React.FC<Props> = ({
  toggle,
  document,
  mutate,
}) => {
  const [displayName, setDisplayName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, createDocumentFile] = useCreateDocumentFile(
    document.author,
    document.slug,
    f => {
      toggle(false);
      mutate(s => ({ ...s, files: [...s.files, f] }));
      setDisplayName("");
      setFile(null);
    },
  );

  return (
    <>
      <Stack>
        <TextInput
          label="Display Name"
          value={displayName}
          onChange={e => setDisplayName(e.currentTarget.value)}
        />
        <FileInput
          label="File"
          placeholder="Click here to pick file..."
          icon={<Icon icon={ICONS.CLOUD_UP} />}
          value={file}
          onChange={setFile}
          accept=".pdf,.tex,.md,.txt,.zip,.apkg,.colpkg,.docx,.xlsx,.pptx" // apkg=anki
        />
        <div>
          PDF, LaTeX, Markdown, Text, Zip, and Anki files are supported. <br />
          If you don't select any file we will create an empty markdown file for
          you that you can edit afterwards.
        </div>
        <Button
          variant="brand"
          loading={loading}
          leftIcon={<Icon icon={ICONS.PLUS} />}
          disabled={loading || displayName.trim() === ""}
          onClick={() =>
            createDocumentFile(
              displayName.trim(),
              file ??
                new NamedBlob(
                  new Blob([], { type: "application/octet-stream" }),
                  "document.md",
                ),
            )
          }
        >
          Add
        </Button>
      </Stack>
    </>
  );
};

export default CreateDocumentFileModal;
