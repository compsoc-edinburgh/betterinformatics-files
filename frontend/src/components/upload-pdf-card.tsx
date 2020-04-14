import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  FormGroup,
  InputField,
  Row,
  Select,
  Spinner,
} from "@vseth/components";
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
      })),
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
      <CardHeader>Upload PDF</CardHeader>
      <CardBody>
        <Form onSubmit={onSubmit}>
          {error && <Alert color="danger">{error.toString()}</Alert>}
          <label className="form-input-label">File</label>
          <FileInput value={file} onChange={setFile} accept="application/pdf" />
          <InputField
            label="Name"
            type="text"
            placeholder="Name"
            value={displayname}
            onChange={e => setDisplayname(e.currentTarget.value)}
            required
          />
          <FormGroup>
            <label className="form-input-label">Category</label>
            <Select
              options={options}
              onChange={(e: any) => setCategory(e.value as string)}
              isLoading={categoriesLoading}
              required
            />
          </FormGroup>
          <Row form>
            <Col md={4}>
              <FormGroup>
                <Button color="primary" type="submit" disabled={loading}>
                  {uploadLoading ? <Spinner /> : "Submit"}
                </Button>
              </FormGroup>
            </Col>
          </Row>
        </Form>
      </CardBody>
    </Card>
  );
};
export default UploadPdfCard;
