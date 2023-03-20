import { Alert, Card, Grid, Loader, NativeSelect } from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import { Button } from "@mantine/core";
import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { Icon, ICONS } from "vseth-canine-ui";
import { loadPaymentCategories, uploadTranscript } from "../api/hooks";
import FileInput from "./file-input";

const UploadTranscriptCard: React.FC<{}> = () => {
  const history = useHistory();
  const {
    error: categoriesError,
    loading: categoriesLoading,
    data: categories,
  } = useRequest(loadPaymentCategories);
  const {
    error: uploadError,
    loading: uploadLoading,
    run: upload,
  } = useRequest(uploadTranscript, {
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
  const [category, setCategory] = useState<string | undefined>();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (file && category) {
      upload(file, category);
    } else if (file === undefined) {
      setValidationError("No file selected");
    } else {
      setValidationError("No category selected");
    }
  };

  return (
    <Card>
      <div>Submit Transcript for Oral Exam</div>
      <div>
        <p>Please use the following template:</p>
        <Button
          leftIcon={<Icon icon={ICONS.DOWNLOAD} />}
          onClick={() => window.open("/static/transcript_template.tex")}
          style={{ marginBottom: "1.5em" }}
        >
          Download template
        </Button>
        <form onSubmit={onSubmit}>
          {error && <Alert color="danger">{error.toString()}</Alert>}
          <label className="form-input-label">File</label>
          <FileInput value={file} onChange={setFile} accept="application/pdf" />
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
export default UploadTranscriptCard;
