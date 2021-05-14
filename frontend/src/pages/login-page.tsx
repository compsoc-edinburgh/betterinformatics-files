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
        <Row>
          <Col md={6} className="d-flex flex-column justify-content-center">
            <h1 className="mb-5 display-3">Community Solutions</h1>
            <h6>
              Community Solutions is a platform for students that allows them to
              share answers of previous exams, comment on answers and upload
              summaries.
            </h6>
          </Col>
          <Col
            md={6}
            className="py-4 px-5 position-relative d-flex align-items-center"
          >
            <svg
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              className="text-dark w-75 m-auto"
            >
              <path
                d="M40.3,-68.2C51.6,-63.2,59.8,-51.2,65.1,-38.7C70.4,-26.1,72.9,-13.1,75.5,1.5C78.2,16.1,81,32.3,76.7,46.6C72.5,61,61.2,73.7,47.2,78.3C33.2,83,16.6,79.6,2.6,75.1C-11.4,70.6,-22.8,64.9,-36.1,59.9C-49.3,54.8,-64.5,50.4,-70.5,40.5C-76.6,30.6,-73.7,15.3,-70.5,1.8C-67.3,-11.6,-63.9,-23.3,-59.8,-36.7C-55.8,-50.1,-51.1,-65.3,-41,-71C-31,-76.7,-15.5,-72.9,-0.5,-72C14.5,-71.2,28.9,-73.2,40.3,-68.2Z"
                transform="translate(100 100)"
              />
            </svg>
            <LoginOverlay />
          </Col>
        </Row>
      </Container>
      {isHome && <CategoryList />}
    </>
  );
};
export default LoginPage;
