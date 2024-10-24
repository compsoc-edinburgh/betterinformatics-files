import {
  Button,
  Modal,
  Badge,
  MantineProvider,
  Box,
  Text,
  Affix,
  rem,
  Group,
  CSSVariablesResolver,
  SegmentedControl,
} from "@mantine/core";
import "@mantine/core/styles.css";
import React, { useEffect, useState } from "react";
import { Route, Switch, useLocation } from "react-router-dom";
import {
  authenticationStatus,
  fetchGet,
  getCookie,
  isTokenExpired,
  login,
  minValidity,
  refreshToken,
} from "./api/fetch-utils";
import { notLoggedIn, SetUserContext, User, UserContext } from "./auth";
import UserRoute from "./auth/UserRoute";
import { DebugContext, defaultDebugOptions } from "./components/Debug";
import DebugModal from "./components/Debug/DebugModal";
import HashLocationHandler from "./components/hash-location-handler";
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
import { useRequest } from "@umijs/hooks";
import TopHeader from "./components/Navbar/TopHeader";
import BottomHeader from "./components/Navbar/BottomHeader";
import MobileHeader from "./components/Navbar/MobileHeader";
import Footer from "./components/footer";
import {
  ConfigOptions,
  defaultConfigOptions,
} from "./components/Navbar/constants";
import makeVsethTheme from "./makeVsethTheme";
import { useDisclosure } from "@mantine/hooks";

const App: React.FC<{}> = () => {
  const [loggedOut, setLoggedOut] = useState(false);
  useEffect(() => {
    let cancel = false;
    // How often refreshing failed
    let counter = 0;
    let counterExp = getCookie("token_expires");

    let handle: ReturnType<typeof setTimeout> | undefined = undefined;
    const startTimer = () => {
      // Check whether we have a token and when it will expire;
      const exp = authenticationStatus();
      if (
        isTokenExpired(exp) &&
        !(counterExp === getCookie("token_expires") && counter > 5)
      ) {
        refreshToken().then(r => {
          if (cancel) return;
          // If the refresh was successful we are happy
          if (r.status >= 200 && r.status < 400) {
            setLoggedOut(false);
            counter = 0;
            return;
          }

          // Otherwise it probably failed
          setLoggedOut(true);
          if (counter === 0) {
            counterExp = getCookie("token_expires");
          }
          counter++;
          return;
        });
      }
      // When we are authenticated (`exp !== undefined`) we want to refresh the token
      // `minValidity` seconds before it expires. If there's no token we recheck this
      // condition every 10 seconds.
      // `Math.max` ensures that we don't call startTimer too often.
      const delay =
        exp !== undefined ? Math.max(3_000, exp - 1000 * minValidity) : 60_000;
      handle = setTimeout(() => {
        startTimer();
      }, delay);
    };
    startTimer();

    return () => {
      cancel = true;
      if (handle === undefined) return;
      clearTimeout(handle);
    };
  }, []);

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
  const [debugPanel, { toggle: toggleDebugPanel, close: closeDebugPanel }] =
    useDisclosure();
  const [debugOptions, setDebugOptions] = useState(defaultDebugOptions);

  const loadUnreadCount = async () => {
    return (await fetchGet("/api/notification/unreadcount/")).value as number;
  };
  const { data: unreadCount } = useRequest(loadUnreadCount, {
    pollingInterval: 300_000,
  });

  const data = (window as any).configOptions as ConfigOptions;

  const fvTheme = makeVsethTheme(data.primaryColor);

  fvTheme.components = {
    Badge: {
      defaultProps: {
        color: "gray",
        variant: "light",
      },
    },
    // By default, SegmentedControl on dark mode has a "light indicator on dark
    // background" look, with the background color of the root component being
    // identical to the page's background color. This makes the component hard
    // to see. We therefore want to override the default styles to flip the
    // colors, while keeping the light mode appearance the same.
    // Mantine gives us a CSS variable (--sc-color) to configure the indicator
    // color, but not the root background color. So we define a new variable to
    // do just that. Both variables are then set in the CSSVariablesResolver
    // based on the theme colors.
    SegmentedControl: SegmentedControl.extend({
      styles: {
        root: {
          // This is the new variable we define to set the root background color
          background: "var(--custom-segmented-control-background)",
        },
      },
    }),
  };

  const adminItems = [
    { title: "Upload Exam", href: "/uploadpdf" },
    { title: "Mod Queue", href: "/modqueue" },
  ];

  const bottomHeaderNav = [
    { title: "Home", href: "/" },
    { title: "Scoreboard ", href: "/scoreboard" },
    {
      title: "More",
      childItems: [
        { title: "FAQ", href: "/faq" },
        { title: "Feedback", href: "/feedback" },
        { title: "Submit Transcript", href: "/submittranscript" },
        ...(typeof user === "object" && user.isCategoryAdmin ? adminItems : []),
      ],
    },
    { title: "Search", href: "/search" },
    {
      title: (
        <Group wrap="nowrap" gap="xs">
          Account
          {unreadCount !== undefined && unreadCount > 0 && (
            <Badge mt={2}>{unreadCount}</Badge>
          )}
        </Group>
      ),
      href: `/user/${user?.username}`,
    },
  ];

  // Change CSS variables depending on the color scheme in use
  const resolver: CSSVariablesResolver = _ => ({
    variables: {},
    light: {
      "--mantine-color-anchor": "var(--mantine-color-black)",
      // Segmented control background
      "--custom-segmented-control-background": "var(--mantine-color-gray-2)",
      // Segmented control indicator
      "--sc-color": "var(--mantine-color-white)",
    },
    dark: {
      "--mantine-color-anchor": "var(--mantine-color-white)",
      "--mantine-color-body": "var(--mantine-color-dark-8)",
      // Segmented control background
      "--custom-segmented-control-background": "var(--mantine-color-dark-6)",
      // Segmented control indicator
      "--sc-color": "var(--mantine-color-dark-8)",
    },
  });

  return (
    <MantineProvider theme={fvTheme} cssVariablesResolver={resolver}>
      <Modal
        opened={loggedOut}
        onClose={() => login()}
        title="You've been logged out due to inactivity"
      >
        <Text mb="md">
          Your session has expired due to inactivity, you have to log in again
          to continue.
        </Text>
        <Button size="lg" variant="outline" onClick={() => login()}>
          Sign in with AAI
        </Button>
      </Modal>
      <Route component={HashLocationHandler} />
      <DebugContext.Provider value={debugOptions}>
        <UserContext.Provider value={user}>
          <SetUserContext.Provider value={setUser}>
            <div>
              <div>
                <TopHeader
                  logo={data.logo ?? defaultConfigOptions.logo}
                  size="xl"
                  organizationNav={
                    data.externalNav ?? defaultConfigOptions.externalNav
                  }
                  selectedLanguage={"en"}
                  onLanguageSelect={() => {}}
                />
                <BottomHeader
                  lang={"en"}
                  appNav={bottomHeaderNav}
                  title={"Community Solutions"}
                  size="xl"
                />
                <MobileHeader
                  signet={data.signet ?? defaultConfigOptions.signet}
                  selectedLanguage={"en"}
                  appNav={bottomHeaderNav}
                  title={"Community Solutions"}
                />
                <Box component="main" mt="2em">
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
                </Box>
              </div>
              <Footer
                logo={data.logo ?? defaultConfigOptions.logo}
                disclaimer={data.disclaimer ?? defaultConfigOptions.disclaimer}
                privacy={data.privacy ?? defaultConfigOptions.privacy}
              />
            </div>
          </SetUserContext.Provider>
        </UserContext.Provider>
      </DebugContext.Provider>
      {process.env.NODE_ENV === "development" && (
        <>
          <Affix position={{ bottom: rem(10), left: rem(10) }}>
            <Button onClick={toggleDebugPanel}>DEBUG</Button>
          </Affix>
          <DebugModal
            isOpen={debugPanel}
            onClose={closeDebugPanel}
            debugOptions={debugOptions}
            setDebugOptions={setDebugOptions}
          />
        </>
      )}
    </MantineProvider>
  );
};
export default App;
