import { Container, Modal, Spinner } from "@vseth/components";
import React from "react";
import { Route, RouteProps } from "react-router-dom";
import { useUser } from ".";
import LoginCard from "../components/login-card";

const UserRouteContent = <T extends RouteProps>({ props }: { props: T }) => {
  const user = useUser();
  if (user === undefined) {
    return (
      <Container>
        <Spinner />
      </Container>
    );
  } else if (!user.loggedin) {
    return (
      <Modal isOpen={true}>
        <LoginCard />
      </Modal>
    );
  } else {
    return <Route {...props} />;
  }
};
const UserRoute = <T extends RouteProps>(props: T) => {
  return (
    <Route
      exact={props.exact}
      path={props.path}
      render={() => <UserRouteContent props={props} />}
    />
  );
};
export default UserRoute;
