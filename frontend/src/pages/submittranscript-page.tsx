import { Col, Container, Row } from "@vseth/components";
import React from "react";
import UploadTranscriptCard from "../components/upload-transcript-card";
import useTitle from "../hooks/useTitle";

const UploadTranscriptPage: React.FC<{}> = () => {
  useTitle("Upload Transcript");
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
