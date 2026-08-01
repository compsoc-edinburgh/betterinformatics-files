import { Alert, Button, FileInput, Stack, TextInput } from "@mantine/core";
import * as React from "react";
import { useState } from "react";
import { IconCloudUpload, IconPlus } from "@tabler/icons-react";
import { useCreateDocumentFile } from "../api/hooks/documents";
import type { DocumentSchema } from "../api/model/documentSchema";

interface Props {
  document: DocumentSchema;
  onClose: () => void;
  refetch: () => void;
}

const CreateDocumentFileModal: React.FC<Props> = ({
  onClose,
  document,
  refetch,
}) => {
  const [displayName, setDisplayName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { mutate, isError, error, isPending } = useCreateDocumentFile({
    mutation: {
      onSuccess() {
        onClose();
        refetch();
        setDisplayName("");
        setFile(null);
      },
    },
  });

  return (
    <>
      <Stack>
        {isError && <Alert color="red">{error as unknown as string}</Alert>}
        <TextInput
          label="Display Name"
          value={displayName}
          onChange={e => setDisplayName(e.currentTarget.value)}
        />
        <FileInput
          label="File"
          placeholder="Click here to pick file..."
          leftSection={<IconCloudUpload />}
          value={file}
          onChange={setFile}
        />
        <div>
          PDF, LaTeX, Markdown, Text, Zip, and Anki files are supported. <br />
          If you don't select any file we will create an empty markdown file for
          you that you can edit afterwards.
        </div>
        <Button
          loading={isPending}
          leftSection={<IconPlus />}
          disabled={isPending || displayName.trim() === ""}
          onClick={() => {
            mutate({
              slug: document.slug,
              data: {
                display_name: displayName.trim(),
                file:
                  file ??
                  new File([], "document.md", {
                    type: "text/markdown",
                  }),
              },
            });
          }}
        >
          Add
        </Button>
      </Stack>
    </>
  );
};

export default CreateDocumentFileModal;
