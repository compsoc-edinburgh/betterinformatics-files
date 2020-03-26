import React, { useEffect, useState, useMemo } from "react";
import { Route, Switch } from "react-router-dom";
import { SetUserContext, User, UserContext, notLoggedIn } from "./auth";
import UserRoute from "./auth/UserRoute";
import ExamsNavbar from "./components/exams-navbar";
import { fetchapi, getCookie } from "./fetch-utils";
import FeedbackPage from "./pages/feedback";
import HomePage from "./pages/home";
import LoginPage from "./pages/login";
import CategoryPage from "./pages/category";
import NotFoundPage from "./pages/not-found";
import ExamPage from "./pages/exam";
import UploadPdfPage from "./pages/uploadpdf";
import TutorialPage from "./pages/tutorial";
import UserPage from "./pages/userinfo";
import Scoreboard from "./pages/scoreboard";

const App: React.FC<{}> = () => {
  const serverData = useMemo(() => {
    const el = document.getElementById("server_data");
    if (el === null) return undefined;
    try {
      const data = JSON.parse(el.textContent || "");
      return data;
    } catch (e) {
      return undefined;
    }
  }, []);
  useEffect(() => {
    if (getCookie("csrftoken") === null) {
      fetchapi("/api/can_i_haz_csrf_cookie/");
    }
  }, []);
  const [user, setUser] = useState<User | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    if (user === undefined) {
      fetchapi("/api/auth/me/").then(
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
              <UserRoute exact path="/" component={HomePage} />
              <Route exact path="/login" component={LoginPage} />
              <Route exact path="/tutorial" component={TutorialPage} />
              <UserRoute exact path="/uploadpdf" component={UploadPdfPage} />
              <UserRoute exact path="/feedback" component={FeedbackPage} />
              <UserRoute
                exact
                path="/category/:slug"
                component={CategoryPage}
              />
              <UserRoute exact path="/exams/:filename" component={ExamPage} />
              <UserRoute exact path="/user/:username" component={UserPage} />
              <UserRoute exact path="/scoreboard" component={Scoreboard} />
              <Route component={NotFoundPage} />
            </Switch>
          </main>
        </div>
      </SetUserContext.Provider>
    </UserContext.Provider>
  );
};
export default App;
