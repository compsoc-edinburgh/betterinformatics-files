import { Container, Row, Col } from "@vseth/components";
import React from "react";
import { css } from "glamor";
const noPadding = css({
  paddingLeft: "0 !important",
  paddingRight: "0 !important",
});
const TwoButtons: React.FC<{
  left?: React.ReactNode;
  right?: React.ReactNode;
}> = ({ left, right }) => {
  return (
    <Container fluid {...noPadding}>
      <Row>
        <Col xs={6} style={{ textAlign: "left" }} {...noPadding}>
          {left}
        </Col>
        <Col xs={6} style={{ textAlign: "right" }} {...noPadding}>
          {right}
        </Col>
      </Row>
    </Container>
  );
};
export default TwoButtons;
