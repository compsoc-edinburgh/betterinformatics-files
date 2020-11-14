import React from "react";
import { Route, RouteProps } from "react-router-dom";
import { useUser } from ".";
import LoadingOverlay from "../components/loading-overlay";
import LoginOverlay from "../pages/login-page";

const UserRouteContent = <T extends RouteProps>({ props }: { props: T }) => {
  const user = useUser();
  if (user !== undefined && !user.loggedin) {
    return <LoginOverlay />;
  } else {
    return (
      <>
        <LoadingOverlay loading={user === undefined} />
        {user !== undefined && <Route {...props} />}
      </>
    );
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
