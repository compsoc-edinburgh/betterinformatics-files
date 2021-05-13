import { Col, Container, Row } from "@vseth/components";
import React from "react";
import LoginOverlay from "../components/login-overlay";
import useTitle from "../hooks/useTitle";
import { CategoryList } from "./home-page";

const LoginPage: React.FC<{ isHome: boolean }> = ({ isHome = false }) => {
  useTitle("Login");
  return (
    <>
      <Container>
        <Row className="my-4">
          <Col md={6}>
            <h1 className="mb-3">Community Solutions</h1>
            <h6>
              Community Solutions is a platform for students that allows them to
              share answers of previous exams, comment on answers and upload
              summaries.
            </h6>
          </Col>
          <Col md={6} className="py-4">
            <LoginOverlay />
          </Col>
        </Row>
      </Container>
      {isHome && <CategoryList />}
    </>
  );
};
export default LoginPage;
