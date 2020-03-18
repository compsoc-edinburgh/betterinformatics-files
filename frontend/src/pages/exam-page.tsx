import { useParams, Link } from "react-router-dom";
import React from "react";
import {
  Container,
  Spinner,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
} from "@vseth/components";
import { fetchapi } from "../fetch-utils";
import { ExamMetaData } from "../interfaces";
import { useRequest } from "@umijs/hooks";

const loadExamMetaData = async (filename: string) => {
  return (await fetchapi(`/api/exam/${filename}/metadata`))
    .value as ExamMetaData;
};

const ExamPage: React.FC<{}> = () => {
  const { filename } = useParams() as { filename: string };
  const {
    error: metaDataError,
    loading: metaDataLoading,
    data: metaData,
  } = useRequest(() => loadExamMetaData(filename));
  const error = metaDataError;
  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/">Home</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <Link to="">{metaData && metaData.category}</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>{metaData && metaData.displayname}</BreadcrumbItem>
      </Breadcrumb>
      {error ? (
        <Alert color="danger">{error}</Alert>
      ) : metaDataLoading ? (
        <Spinner />
      ) : (
        metaData && (
          <pre>
            <code>{JSON.stringify(metaData, undefined, 3)}</code>
          </pre>
        )
      )}
    </Container>
  );
};
export default ExamPage;
