import { Grid, Loader, NativeSelect, TextInput } from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import { Alert, Button, Card } from "@mantine/core";
import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { loadCategories, uploadPdf } from "../api/hooks";
import FileInput from "./file-input";

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
  const [file, setFile] = useState<File | undefined>();
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
    <Card>
      <div>Upload PDF</div>
      <div>
        <form onSubmit={onSubmit}>
          {error && <Alert color="danger">{error.toString()}</Alert>}
          <label className="form-input-label">File</label>
          <FileInput value={file} onChange={setFile} accept="application/pdf" />
          <TextInput
            label="Name"
            placeholder="Name"
            value={displayname}
            onChange={e => setDisplayname(e.currentTarget.value)}
            required
          />
          <label className="form-input-label">Category</label>
          <NativeSelect
            data={options}
            onChange={(event: any) =>
              setCategory(event.currentTarget.value as string)
            }
            required
          />
          <Grid>
            <Grid.Col md={4}>
              <Button color="primary" type="submit" disabled={loading}>
                {uploadLoading ? <Loader /> : "Submit"}
              </Button>
            </Grid.Col>
          </Grid>
        </form>
      </div>
    </Card>
  );
};
export default UploadPdfCard;
