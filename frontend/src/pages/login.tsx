import { Col, Container, Row } from "@vseth/components";
import React from "react";
import LoginCard from "../components/login-card";
import useTitle from "../hooks/useTitle";

const LoginPage: React.FC<{}> = () => {
  useTitle("Login - VIS Community Solutions");
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
