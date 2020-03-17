import { RouteProps, Route, Redirect } from "react-router-dom";
import React, { useEffect } from "react";
import { useUser, useSetUser } from ".";
import { fetchapi } from "../fetch-utils";
import { Container, Spinner } from "@vseth/components";

const UserRouteContent = <T extends RouteProps>({ props }: { props: T }) => {
  const user = useUser();
  const setUser = useSetUser();
  useEffect(() => {
    let cancelled = false;
    if (user === undefined) {
      fetchapi("/api/me").then(
        res => {
          if (cancelled) return;
          setUser({
            loggedin: res.loggedin,
            username: res.username,
            displayname: res.displayname,
            isAdmin: res.adminrights,
            isCategoryAdmin: res.adminrightscat,
          });
        },
        () => {
          setUser(false);
        },
      );
    }
    return () => {
      cancelled = true;
    };
  }, [user, setUser]);
  if (user === undefined) {
    return (
      <Container>
        <Spinner />
      </Container>
    );
  } else if (user === false) {
    return <Redirect to="/login" />;
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
