import { useLocation, Outlet } from "react-router-dom";
import { useUser } from ".";
import LoadingOverlay from "../components/loading-overlay";
import LoginOverlay from "../pages/login-page";

export const AuthenticatedRoutes = () => {
  const user = useUser();
  const { pathname } = useLocation();

  if (user !== undefined && !user.loggedin) {
    return <LoginOverlay isHome={pathname === "/"} />;
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
