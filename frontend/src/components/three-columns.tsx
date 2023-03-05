import { Container, Grid } from "@mantine/core";
import React from "react";

const ThreeColumns: React.FC<{
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}> = ({ left, center, right }) => {
  return (
    <Container fluid className="px-0">
      <Grid>
        <Grid.Col
          sm={4}
          xs={6}
          className={`px-0 text-left ${!left ? "d-none d-sm-block" : ""}`}
        >
          {left}
        </Grid.Col>
        <Grid.Col
          sm={4}
          xs={left || right ? 6 : 12}
          className={`px-0 text-sm-center ${left ? "text-right" : right ? "text-left" : "text-center"
            } ${!center ? " d-none d-sm-block" : ""}`}
        >
          {center}
        </Grid.Col>
        <Grid.Col
          sm={4}
          xs={(left && center) || (!left && !center) ? 12 : 6}
          className={`px-0 text-right ${left && center ? "mt-1 mt-sm-0" : ""} ${!right ? " d-none d-sm-block" : ""
            }`}
        >
          {right}
        </Grid.Col>
      </Grid>
    </Container>
  );
};
export default ThreeColumns;
