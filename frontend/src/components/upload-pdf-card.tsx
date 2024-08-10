import { FileInput, Select, Stack, TextInput, Title } from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import { Alert, Button, Card } from "@mantine/core";
import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { loadCategories, uploadPdf } from "../api/hooks";
import { IconCloudUpload } from "@tabler/icons-react";

const UploadPdfCard: React.FC<{}> = () => {
  const history = useHistory();
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
    onSuccess: filename => history.push(`/exams/${filename}`),
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
  const [category, setCategory] = useState<string | undefined>();
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
    <Card withBorder shadow="md">
      <Card.Section withBorder p="md">
        <Title order={4}>Upload PDF</Title>
      </Card.Section>
      <div>
        <form onSubmit={onSubmit}>
          <Stack mt="sm">
            {error && <Alert color="red">{error.toString()}</Alert>}
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
              placeholder="Name"
              value={displayname}
              onChange={e => setDisplayname(e.currentTarget.value)}
              required
            />
            <Select
              label="Category"
              placeholder="Choose category..."
              searchable
              nothingFoundMessage="No category found"
              data={options}
              onChange={(value: string | null) => value && setCategory(value)}
              required
            />
            <Button type="submit" loading={loading}>
              Submit
            </Button>
          </Stack>
        </form>
      </div>
    </Card>
  );
};
export default UploadPdfCard;
