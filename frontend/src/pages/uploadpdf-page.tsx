import { Col, Container, Row } from "@vseth/components";
import React from "react";
import UploadPdfCard from "../components/upload-pdf-card";
import useTitle from "../hooks/useTitle";

const UploadPdfPage: React.FC<{}> = () => {
  useTitle("Upload PDF");
  return (
    <Container>
      <Row>
        <Col />
        <Col lg="6">
          <UploadPdfCard />
        </Col>
        <Col />
      </Row>
    </Container>
  );
};
export default UploadPdfPage;
