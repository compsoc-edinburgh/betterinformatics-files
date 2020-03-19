import { Container, Row, Col } from "@vseth/components";
import React from "react";
import { css } from "glamor";
const noPadding = css({
  paddingLeft: "0 !important",
  paddingRight: "0 !important",
});
const ThreeButtons: React.FC<{
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}> = ({ left, center, right }) => {
  return (
    <Container fluid {...noPadding}>
      <Row>
        <Col xs={4} style={{ textAlign: "left" }} {...noPadding}>
          {left}
        </Col>
        <Col xs={4} style={{ textAlign: "center" }} {...noPadding}>
          {center}
        </Col>
        <Col xs={4} style={{ textAlign: "right" }} {...noPadding}>
          {right}
        </Col>
      </Row>
    </Container>
  );
};
export default ThreeButtons;
