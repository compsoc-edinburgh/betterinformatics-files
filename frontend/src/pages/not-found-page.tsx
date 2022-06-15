import { Container, Row, Col } from "@vseth/components";
import React from "react";
import useTitle from "../hooks/useTitle";
import { ReactComponent as Bjoern } from "../assets/bjoern.svg";

const NotFoundPage: React.FC<{}> = () => {
  useTitle("404");
  return (
    <Container className="my-3">
      <Row>
        <Col sm={9} md={8} lg={6} className="m-auto">
          <h1>This is a 404.</h1>
          <h5>
            No need to freak out. Did you enter the URL correctly? For this
            inconvenience, have this drawing of Björn:
          </h5>
        </Col>
        <Col sm={9} md={8} lg={6} className="m-auto">
          <Bjoern className="my-2" />
        </Col>
      </Row>
    </Container>
  );
};
export default NotFoundPage;
