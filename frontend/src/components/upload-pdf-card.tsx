import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  FormGroup,
  InputField,
  ListGroup,
  ListGroupItem,
  Row,
  Select,
} from "@vseth/components";
import React, { useState } from "react";
import { fetchapi } from "../fetch-utils";
import { CategoryMetaDataMinimal } from "../interfaces";

const loadCategories = async () => {
  return (await fetchapi("/api/category/listonlyadmin/"))
    .value as CategoryMetaDataMinimal[];
};

const LoginCard: React.FC<{}> = () => {
  const {
    error: categoriesError,
    loading: categoriesLoading,
    data: categories,
  } = useRequest(loadCategories);
  const error = categoriesError;
  const loading = categoriesLoading;

  const options = categories?.map(category => ({
    value: category.slug,
    label: category.displayname,
  }));

  const [file, setFile] = useState<File | undefined>();
  const [displayname, setDisplayname] = useState("");
  const [category, setCategory] = useState<string | undefined>();

  return (
    <Card>
      <CardHeader>Upload PDF</CardHeader>
      <CardBody>
        <Form
          onSubmit={e => {
            e.preventDefault();
          }}
        >
          {error && <Alert color="danger">{error}</Alert>}
          <InputField
            type="file"
            label="PDF"
            onChange={e => {
              setFile((e.currentTarget.files || [])[0]);
              e.currentTarget.value = "";
            }}
          />
          {file && (
            <ListGroup>
              <ListGroupItem>
                {file.name}
                <Badge>{file.type}</Badge> <Badge>{file.size}</Badge>
              </ListGroupItem>
            </ListGroup>
          )}
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
                  Submit
                </Button>
              </FormGroup>
            </Col>
          </Row>
        </Form>
      </CardBody>
    </Card>
  );
};
export default LoginCard;
