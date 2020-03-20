import React, { useEffect, useState } from "react";
import { Route, Switch } from "react-router-dom";
import { SetUserContext, User, UserContext, notLoggedIn } from "./auth";
import UserRoute from "./auth/UserRoute";
import ExamsNavbar from "./components/exams-navbar";
import { fetchapi } from "./fetch-utils";
import FeedbackPage from "./pages/feedback-page";
import HomePage from "./pages/home-page";
import LoginPage from "./pages/login-page";
import CategoryPage from "./pages/category-page";
import NotFoundPage from "./pages/not-found-page";
import ExamPage from "./pages/exam-page";
import UploadPdfPage from "./pages/uploadpdf";
import TutorialPage from "./pages/tutorial";
import UserPage from "./pages/userinfo";

const App: React.FC<{}> = () => {
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
              <Route component={NotFoundPage} />
            </Switch>
          </main>
        </div>
      </SetUserContext.Provider>
    </UserContext.Provider>
  );
};
export default App;
