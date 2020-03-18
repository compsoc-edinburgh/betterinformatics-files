import React, { useEffect, useState } from "react";
import { Route, Switch } from "react-router-dom";
import { SetUserContext, User, UserContext, notLoggedIn } from "./auth";
import UserRoute from "./auth/UserRoute";
import ExamsNavbar from "./components/exams-navbar";
import { fetchapi } from "./fetch-utils";
import FeedbackPage from "./pages/feedback-page";
import HomePage from "./pages/home-page";
import LoginPage from "./pages/login-page";

const App: React.FC<{}> = () => {
  const [user, setUser] = useState<User | undefined>(undefined);
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
          setUser(notLoggedIn);
        },
      );
    }
    return () => {
      cancelled = true;
    };
  }, [user]);
  return (
    <UserContext.Provider value={user}>
      <SetUserContext.Provider value={setUser}>
        <div className="mobile-capable">
          <ExamsNavbar />
          <main className="main__container">
            <Switch>
              <Route exact path="/login" component={LoginPage} />
              <UserRoute exact path="/" component={HomePage} />
              <UserRoute exact path="/feedback" component={FeedbackPage} />
            </Switch>
          </main>
        </div>
      </SetUserContext.Provider>
    </UserContext.Provider>
  );
};
export default App;
