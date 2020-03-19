import { Col, Container, Row } from "@vseth/components";
import React from "react";
import UploadPdfCard from "../components/upload-pdf-card";

const UploadPdfPage: React.FC<{}> = () => {
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
