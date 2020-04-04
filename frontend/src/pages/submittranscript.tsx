import { Col, Container, Row } from "@vseth/components";
import React from "react";
import UploadTranscriptCard from "../components/upload-transcript-card";

const UploadTranscriptPage: React.FC<{}> = () => {
  return (
    <Container>
      <Row>
        <Col />
        <Col lg="6">
          <UploadTranscriptCard />
        </Col>
        <Col />
      </Row>
    </Container>
  );
};
export default UploadTranscriptPage;
