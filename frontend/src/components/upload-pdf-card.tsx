import {
  Alert,
  Button,
  FileInput,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { loadCategories, uploadPdf } from "../api/hooks";
import { useUser } from "../auth";
import { IconCloudUpload } from "@tabler/icons-react";

const UploadPdfCard: React.FC<{ preChosenCategory?: string }> = ({
  preChosenCategory,
}) => {
  const history = useHistory();
  const [message, setMessage] = useState("");
  const { isCategoryAdmin } = useUser()!;

  const {
    error: categoriesError,
    loading: categoriesLoading,
    data: categories,
  } = useRequest(loadCategories);
  const {
    error: uploadError,
    loading: uploadLoading,
    run: upload,
  } = useRequest(uploadPdf, {
    manual: true,
    onSuccess: filename => {
      if (isCategoryAdmin) {
        // Admins will be able to view the uploaded file but not regular users,
        history.push(`/exams/${filename}`);
      } else {
        // Reset file input and show success message
        setFile(undefined);
        setMessage(
          "Thank you for the upload! You won't see it immediately, but a " +
            "moderator will review it soon and make it public. Exam uploads " +
            "need to be reviewed as it has to have correct metadata and " +
            "questions need to be cut up, unlike community documents that are " +
            "free to upload, apologies!",
        );
      }
    },
  });
  const [validationError, setValidationError] = useState("");
  const error = categoriesError || uploadError || validationError;
  const loading = categoriesLoading || uploadLoading;
  const options = useMemo(
    () =>
      categories?.map(category => ({
        value: category.slug,
        label: category.displayname,
      })) ?? [],
    [categories],
  );
  const [file, setFile] = useState<File | null>();
  const [displayname, setDisplayname] = useState("");
  const [category, setCategory] = useState<string | undefined>(
    preChosenCategory,
  );
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (file && category) {
      upload(file, displayname, category);
    } else if (file === undefined) {
      setValidationError("No file selected");
    } else {
      setValidationError("No category selected");
    }
  };
  return (
    <>
      <div>
        <form onSubmit={onSubmit}>
          <Stack>
            {error && <Alert color="red">{error.toString()}</Alert>}
            {message && <Alert color="blue">{message}</Alert>}
            <FileInput
              label="File"
              placeholder="Click to choose file..."
              leftSection={<IconCloudUpload />}
              value={file}
              onChange={setFile}
              accept="application/pdf"
            />
            <TextInput
              label="Name"
              placeholder="December 2030"
              value={displayname}
              onChange={e => setDisplayname(e.currentTarget.value)}
              required
            />
            {!preChosenCategory && (
              <Select
                label="Category"
                placeholder="Choose category..."
                searchable
                nothingFoundMessage="No category found"
                data={options}
                onChange={(value: string | null) => value && setCategory(value)}
                required
              />
            )}
            {!isCategoryAdmin && (
              <Text>
                Exam uploads need to be reviewed unlike community documents, so
                your contribution won't appear immediately.
              </Text>
            )}
            <Button type="submit" loading={loading}>
              Submit
            </Button>
          </Stack>
        </form>
      </div>
    </>
  );
};
export default UploadPdfCard;
