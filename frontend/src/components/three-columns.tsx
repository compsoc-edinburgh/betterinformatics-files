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
        <Col sm={4} xs={6} className="px-0 text-left">{left}</Col>
        <Col sm={4} xs={6} className="px-0 @media (max-width: 767px) { text-right { text-align:center }} text-sm-center">{center}</Col>
        <Col sm={4} xs={12} className="px-0 text-right">{right}</Col>
      </Row>
    </Container>
  );
};
export default ThreeColumns;
