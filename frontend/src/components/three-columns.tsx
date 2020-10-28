import { Col, Container, Row } from "@vseth/components";
import React from "react";

const ThreeColumns: React.FC<{
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}> = ({ left, center, right }) => {
  return (
    <Container fluid className="px-0 align-items-center">
      <Row>
        <Col md={4} xs={6} className="px-0">{left}</Col>
        <Col md={4} xs={6} className="px-0">{center}</Col>
        <Col md={4} xs={12} className="px-0">{right}</Col>
      </Row>
    </Container>
  );
};
export default ThreeColumns;
