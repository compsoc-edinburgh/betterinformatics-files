import { css } from "@emotion/css";
import {
  Button,
  Col,
  Container,
  GitlabIcon,
  LikeFilledIcon,
  Logo,
  Modal,
  ModalBody,
  ModalHeader,
  Row,
  VSETHContext,
} from "@vseth/components";
import React, { useEffect, useState } from "react";
import { Route, Switch } from "react-router-dom";
import {
  authenticationStatus,
  fetchGet,
  getCookie,
  isTokenExpired,
  minValidity,
  // refreshToken,
} from "./api/fetch-utils";
import { notLoggedIn, SetUserContext, User, UserContext } from "./auth";
import UserRoute from "./auth/UserRoute";
import { DebugContext, defaultDebugOptions } from "./components/Debug";
import DebugModal from "./components/Debug/DebugModal";
import ExamsNavbar from "./components/exams-navbar";
import HashLocationHandler from "./components/hash-location-handler";
import useToggle from "./hooks/useToggle";
import CategoryPage from "./pages/category-page";
import DocumentPage from "./pages/document-page";
import ExamPage from "./pages/exam-page";
import FAQ from "./pages/faq-page";
import FeedbackPage from "./pages/feedback-page";
import HomePage from "./pages/home-page";
import LoginPage from "./pages/login-page";
import ModQueue from "./pages/modqueue-page";
import NotFoundPage from "./pages/not-found-page";
import Scoreboard from "./pages/scoreboard-page";
import SearchPage from "./pages/search-page";
import UploadTranscriptPage from "./pages/submittranscript-page";
import UploadPdfPage from "./pages/uploadpdf-page";
import UserPage from "./pages/userinfo-page";
import serverData from "./utils/server-data";
const minHeight = css`
  min-height: 100vh;
`;
const App: React.FC<{}> = () => {
  // const [loggedOut, setLoggedOut] = useState(false);
  // useEffect(() => {
  //   let cancel = false;
  //   // How often refreshing failed
  //   let counter = 0;
  //   let counterExp = getCookie("token_expires");

  //   let handle: ReturnType<typeof setTimeout> | undefined = undefined;
  //   const startTimer = () => {
  //     // Check whether we have a token and when it will expire;
  //     const exp = authenticationStatus();
  //     if (
  //       isTokenExpired(exp) &&
  //       !(counterExp === getCookie("token_expires") && counter > 5)
  //     ) {
  //       refreshToken().then(r => {
  //         if (cancel) return;
  //         // If the refresh was successful we are happy
  //         if (r.status >= 200 && r.status < 400) {
  //           setLoggedOut(false);
  //           counter = 0;
  //           return;
  //         }

  //         // Otherwise it probably failed
  //         setLoggedOut(true);
  //         if (counter === 0) {
  //           counterExp = getCookie("token_expires");
  //         }
  //         counter++;
  //         return;
  //       });
  //     }
  //     // When we are authenticated (`exp !== undefined`) we want to refresh the token
  //     // `minValidity` seconds before it expires. If there's no token we recheck this
  //     // condition every 10 seconds.
  //     // `Math.max` ensures that we don't call startTimer too often.
  //     const delay =
  //       exp !== undefined ? Math.max(3_000, exp - 1000 * minValidity) : 60_000;
  //     handle = setTimeout(() => {
  //       startTimer();
  //     }, delay);
  //   };
  //   startTimer();

  //   return () => {
  //     cancel = true;
  //     if (handle === undefined) return;
  //     clearTimeout(handle);
  //   };
  // }, []);

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
      {/* <Modal isOpen={loggedOut}>
        <ModalHeader>You've been logged out due to inactivity</ModalHeader>
        <ModalBody>
          Your session has expired due to inactivity, you have to log in again
          to continue.
          <div className="text-center py-3">
            <Button size="lg" color="primary" outline onClick={() => login()}>
              Sign in with AAI
            </Button>
          </div>
        </ModalBody>
      </Modal> */}
      <Route component={HashLocationHandler} />
      <DebugContext.Provider value={debugOptions}>
        <UserContext.Provider value={user}>
          <SetUserContext.Provider value={setUser}>
            <div
              className={`mobile-capable position-relative ${minHeight} d-flex flex-column justify-content-between`}
            >
              <div>
                <ExamsNavbar />
                <main className="main__container pb-5">
                  <Switch>
                    <UserRoute exact path="/" component={HomePage} />
                    <Route exact path="/login" component={LoginPage} />
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
                    <UserRoute
                      exact
                      path="/feedback"
                      component={FeedbackPage}
                    />
                    <UserRoute
                      exact
                      path="/category/:slug"
                      component={CategoryPage}
                    />
                    <UserRoute
                      exact
                      path="/user/:author/document/:slug"
                      component={DocumentPage}
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
                    <UserRoute exact path="/user/" component={UserPage} />
                    <UserRoute exact path="/search/" component={SearchPage} />
                    <UserRoute
                      exact
                      path="/scoreboard"
                      component={Scoreboard}
                    />
                    <UserRoute exact path="/modqueue" component={ModQueue} />
                    <Route component={NotFoundPage} />
                  </Switch>
                </main>
              </div>
              <div className="py-3">
                <Container>
                  <Logo variant="logo-mono" />
                  <div className="bg-primary my-3" style={{ height: 2 }} />
                  <Row>
                    <Col xs="auto" form className="font-weight-bold">
                      Made with{" "}
                      <LikeFilledIcon
                        color="currenColor"
                        className="mx-1 text-danger"
                        aria-label="love"
                      />{" "}
                      by volunteers at{" "}
                      <a
                        href="http://vis.ethz.ch/"
                        title="Verein der Informatik Studierenden an der ETH Zürich"
                        className="text-primary"
                      >
                        VIS
                      </a>
                    </Col>
                    <Col xs="auto" form>
                      <a
                        href="https://gitlab.ethz.ch/vseth/sip-com-apps/community-solutions"
                        className="text-primary"
                      >
                        <GitlabIcon color="primary" /> Repository
                      </a>
                    </Col>
                    <Col xs="auto" form>
                      <a href={serverData.imprint} className="text-primary">
                        Imprint
                      </a>
                    </Col>
                    <Col xs="auto" form>
                      <a
                        href={serverData.privacy_policy}
                        className="text-primary"
                      >
                        Privacy Policy
                      </a>
                    </Col>
                  </Row>
                </Container>
              </div>
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
