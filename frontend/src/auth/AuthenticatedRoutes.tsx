import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useUser } from ".";
import LoadingOverlay from "../components/loading-overlay";
import LoginOverlay from "../pages/login-page";

export const AuthenticatedRoutes = () => {
  const user = useUser();
  const location = useLocation();

  if (user !== undefined && !user.loggedin) {
    if (location.pathname === "/") return <LoginOverlay isHome={true} />;

    return <Navigate replace to={{
      pathname: "/login/",
      search: `?rd=${encodeURIComponent(location.pathname + location.search + location.hash)}`}}/>;
  } else {
    return (
      <>
        <LoadingOverlay visible={user === undefined} />
        {user !== undefined && <Outlet />}
      </>
    );
  }
};
export default AuthenticatedRoutes;
