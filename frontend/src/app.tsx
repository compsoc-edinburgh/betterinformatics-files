import React, { useEffect, useState } from "react";
import { Route, Switch } from "react-router-dom";
import { fetchapi, getCookie } from "./api/fetch-utils";
import { notLoggedIn, SetUserContext, User, UserContext } from "./auth";
import UserRoute from "./auth/UserRoute";
import ExamsNavbar from "./components/exams-navbar";
import CategoryPage from "./pages/category";
import ExamPage from "./pages/exam";
import FeedbackPage from "./pages/feedback";
import HomePage from "./pages/home";
import LoginPage from "./pages/login";
import ModQueue from "./pages/modqueue";
import NotFoundPage from "./pages/not-found";
import Scoreboard from "./pages/scoreboard";
import TutorialPage from "./pages/tutorial";
import UploadPdfPage from "./pages/uploadpdf";
import UserPage from "./pages/userinfo";
import UploadTranscriptPage from "./pages/submittranscript";
import HashLocationHandler from "./components/hash-location-handler";

const App: React.FC<{}> = () => {
  /*const _serverData = useMemo(() => {
    const el = document.getElementById("server_data");
    if (el === null) return undefined;
    try {
      const data = JSON.parse(el.textContent || "");
      return data;
    } catch (e) {
      return undefined;
    }
  }, []);*/
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
    <>
      <Route component={HashLocationHandler} />
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
                <UserRoute
                  exact
                  path="/submittranscript"
                  component={UploadTranscriptPage}
                />
                <UserRoute exact path="/feedback" component={FeedbackPage} />
                <UserRoute
                  exact
                  path="/category/:slug"
                  component={CategoryPage}
                />
                <UserRoute exact path="/exams/:filename" component={ExamPage} />
                <UserRoute exact path="/user/:username" component={UserPage} />
                <UserRoute exact path="/scoreboard" component={Scoreboard} />
                <UserRoute exact path="/modqueue" component={ModQueue} />
                <Route component={NotFoundPage} />
              </Switch>
            </main>
          </div>
        </SetUserContext.Provider>
      </UserContext.Provider>
    </>
  );
};
export default App;
