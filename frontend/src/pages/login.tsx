import { Col, Container, Row } from "@vseth/components";
import React from "react";
import LoginCard from "../components/login-card";

const LoginPage: React.FC<{}> = () => {
  return (
    <Container>
      <Row>
        <Col />
        <Col lg="6">
          <LoginCard />
        </Col>
        <Col />
      </Row>
    </Container>
  );
};
export default LoginPage;
