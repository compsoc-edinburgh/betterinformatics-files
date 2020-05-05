import { Col, Container, Row } from "@vseth/components";
import React from "react";

const ThreeColumns: React.FC<{
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}> = ({ left, center, right }) => {
  return (
    <Container fluid className="p-0">
      <Row>
        <Col xs={4} className="px-0 text-left">
          {left}
        </Col>
        <Col xs={4} className="px-0 text-center">
          {center}
        </Col>
        <Col xs={4} className="px-0 text-right">
          {right}
        </Col>
      </Row>
    </Container>
  );
};
export default ThreeColumns;
