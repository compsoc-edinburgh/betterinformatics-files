import { Button, VSETHContext } from "@vseth/components";
import React, { useEffect, useState } from "react";
import { Route, Switch } from "react-router-dom";
import { fetchGet, getCookie } from "./api/fetch-utils";
import { notLoggedIn, SetUserContext, User, UserContext } from "./auth";
import UserRoute from "./auth/UserRoute";
import { DebugContext, defaultDebugOptions } from "./components/Debug";
import DebugModal from "./components/Debug/DebugModal";
import ExamsNavbar from "./components/exams-navbar";
import HashLocationHandler from "./components/hash-location-handler";
import useToggle from "./hooks/useToggle";
import CategoryPage from "./pages/category-page";
import ExamPage from "./pages/exam-page";
import FAQ from "./pages/faq-page";
import FeedbackPage from "./pages/feedback-page";
import HomePage from "./pages/home-page";
import LoginPage from "./pages/login-page";
import ModQueue from "./pages/modqueue-page";
import NotFoundPage from "./pages/not-found-page";
import Scoreboard from "./pages/scoreboard-page";
import UploadTranscriptPage from "./pages/submittranscript-page";
import TutorialPage from "./pages/tutorial-page";
import UploadPdfPage from "./pages/uploadpdf-page";
import UserPage from "./pages/userinfo-page";

const App: React.FC<{}> = () => {
  useEffect(() => {
    // We need to manually get the csrf cookie when the frontend is served using
    // `yarn start` as only certain pages will set the csrf cookie.
    // Technically the application won't work until the promise resolves, but we just
    // hope that the user doesn't do anything in that time.
    if (getCookie("csrftoken") === null) {
      fetchGet("/api/can_i_haz_csrf_cookie/");
    }
  }, []);
  const [user, setUser] = useState<User | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    if (user === undefined) {
      fetchGet("/api/auth/me/").then(
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
  const [debugPanel, toggleDebugPanel] = useToggle(false);
  const [debugOptions, setDebugOptions] = useState(defaultDebugOptions);
  return (
    <VSETHContext>
      <Route component={HashLocationHandler} />
      <DebugContext.Provider value={debugOptions}>
        <UserContext.Provider value={user}>
          <SetUserContext.Provider value={setUser}>
            <div className="mobile-capable">
              <ExamsNavbar />
              <main className="main__container">
                <Switch>
                  <UserRoute exact path="/" component={HomePage} />
                  <Route exact path="/login" component={LoginPage} />
                  <Route exact path="/tutorial" component={TutorialPage} />
                  <UserRoute
                    exact
                    path="/uploadpdf"
                    component={UploadPdfPage}
                  />
                  <UserRoute
                    exact
                    path="/submittranscript"
                    component={UploadTranscriptPage}
                  />
                  <UserRoute exact path="/faq" component={FAQ} />
                  <UserRoute exact path="/feedback" component={FeedbackPage} />
                  <UserRoute
                    exact
                    path="/category/:slug"
                    component={CategoryPage}
                  />
                  <UserRoute
                    exact
                    path="/exams/:filename"
                    component={ExamPage}
                  />
                  <UserRoute
                    exact
                    path="/user/:username"
                    component={UserPage}
                  />
                  <UserRoute exact path="/scoreboard" component={Scoreboard} />
                  <UserRoute exact path="/modqueue" component={ModQueue} />
                  <Route component={NotFoundPage} />
                </Switch>
              </main>
            </div>
          </SetUserContext.Provider>
        </UserContext.Provider>
      </DebugContext.Provider>
      {process.env.NODE_ENV === "development" && (
        <>
          <div className="position-fixed" style={{ bottom: 0, left: 0 }}>
            <Button color="white" onClick={toggleDebugPanel}>
              DEBUG
            </Button>
          </div>
          <DebugModal
            isOpen={debugPanel}
            toggle={toggleDebugPanel}
            debugOptions={debugOptions}
            setDebugOptions={setDebugOptions}
          />
        </>
      )}
    </VSETHContext>
  );
};
export default App;
