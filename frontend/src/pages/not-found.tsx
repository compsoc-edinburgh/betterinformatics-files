import { Container } from "@vseth/components";
import React from "react";
import useTitle from "../hooks/useTitle";

const NotFoundPage: React.FC<{}> = () => {
  useTitle("404 - VIS Community Solutions");
  return (
    <Container>
      <h1>This is a 404.</h1>
      <h5>
        No need to freak out. Did you enter the URL correctly? For this
        inconvenience, have this drawing of Björn:
      </h5>
      <img
        src="https://vis.ethz.ch/vis-website/static/img/björn.svg"
        style={{
          width: "30vw",
          margin: "auto",
          display: "block",
        }}
        alt="Björn"
      />
    </Container>
  );
};
export default NotFoundPage;
