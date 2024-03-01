import { Route, RouteProps, Redirect, useLocation } from "react-router-dom";
import { useUser } from ".";
import LoadingOverlay from "../components/loading-overlay";
import LoginOverlay from "../pages/login-page";

const UserRouteContent = <T extends RouteProps>({
  props,
  loginProps,
}: {
  props: T;
  loginProps: Parameters<typeof LoginOverlay>[0];
}) => {
  const user = useUser();
  const location = useLocation();

  if (user !== undefined && !user.loggedin) {
    // On the root home page, we don't want to redirect to /login but rather
    // show the login page content directly (with isHome set so it'll also show
    // the category list)
    if (loginProps.isHome) return <LoginOverlay {...loginProps} />;
    // On all other pages, we want to redirect to /login. Otherwise, the login
    // form will show on any page without the URL changing, which makes it both
    // challenging to redirect post-login, and also confusing semantically for
    // the user.
    //
    // With these conditionals, we contract the logic to be that:
    // - There is no /login page content shown unless the URL is /login
    // - If the user is not logged in, they are redirected to /login
    // - The homepage is the sole exception to the above rule and the reason
    //   is that the content is different anyway (i.e. shows category list) and
    //   it's better to get users immersed in content as quickly as possible
    return <Redirect to={{
      pathname: "/login/",
      search: `?rd=${encodeURIComponent(location.pathname + location.search + location.hash)}`}}/>;
  } else {
    return (
      <>
        <LoadingOverlay visible={user === undefined} />
        {user !== undefined && <Route {...props} />}
      </>
    );
  }
};
const UserRoute = <T extends RouteProps>(props: T) => {
  return (
    <Route exact={props.exact} path={props.path}>
      <UserRouteContent
        props={props}
        loginProps={{ isHome: props.path === "/" }}
      />
    </Route>
  );
};
export default UserRoute;
