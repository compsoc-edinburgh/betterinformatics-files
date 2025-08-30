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
import { Route, Switch } from "react-router-dom";
import {
  getAuthenticationExpiry,
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
import AnnouncementHeader from "./components/Navbar/AnnouncementHeader";
import FlaggedContent from "./pages/flagged-content";
import { FaroRoute } from "@grafana/faro-react";
import serverData from "./utils/server-data";
import { QuickSearchFilter, QuickSearchFilterContext } from "./components/Navbar/QuickSearch/QuickSearchFilterContext";

/**
 * To be used as a wrapper for <Route>s at the top level, and adds Faro
 * support to all child routes.
 *
 * Note: This creates a catch-all routing context. Any wildcard routes defined
 * after a Router as a sibling will never be matched. Define all routes within
 * the element instead.
 *
 * Behaves as a no-op if either of the following is true:
 * - Faro is disabled via the VITE_FARO_DISABLE frontend environment variable
 * - Faro URL doesn't exist in the VITE_SERVER_DATA frontend environment variable
 *
 * By default, if ran with `yarn start`, Faro URL exists but the DISABLE flag is
 * true (see `.env.development`). Use `VITE_FARO_DISABLE=false yarn start` to
 * enable Faro support in development.
 *
 * In production builds, observability is controlled via the FRONTEND_SERVER_DATA
 * backend setting.
 */
const Router = ({ children }: { children?: React.ReactNode }) =>
  import.meta.env.VITE_FARO_DISABLE === "true" || !serverData.faro_url ? (
    children
  ) : (
    <FaroRoute path="/">{children}</FaroRoute>
  );

const App: React.FC<{}> = () => {
  const [loggedOut, setLoggedOut] = useState(false);
  useEffect(() => {
    let cancel = false;
    // Keep track of consecutive failed token refreshes (per token expiry), so
    // we don't infinitely try refreshing access token if it doesn't work
    let failedCount = 0;
    // Keep track of the expiry of the token if it failed to refresh -- this is
    // used to so we can reset the consecutive-retry-limit if the token was
    // refreshed by another tab.
    let failedTokenExpiry: number | undefined = undefined;

    let handle: ReturnType<typeof setTimeout> | undefined = undefined;
    const startTimer = () => {
      // Check whether we have a token and when it will expire;
      const { token: exp, refresh: refresh_exp } = getAuthenticationExpiry();
      if (
        // Token is nearly expiring or is expired
        isTokenExpired(exp) &&
        // AND we haven't hit the retry limit yet (or ignore the limit if expiry
        // is different to any previously failed expiry)
        (exp !== failedTokenExpiry || failedCount <= 5)
      ) {
        // Only refresh if refresh token isn't expired. We resolve a void promise
        // if the refresh token is expired, so we can use the same handling code
        // to increment counter & show the modal.
        (isTokenExpired(refresh_exp) ? Promise.resolve() : refreshToken()).then(
          r => {
            if (cancel) return;

            // If the refresh was successful we are happy
            if (r && r.status >= 200 && r.status < 400) {
              setLoggedOut(false);
              // Reset the counter, there is a new token
              failedCount = 0;
              return;
            }

            // Refresh failed, or we didn't refresh (due to expired refresh token)
            // We should retry a few times to a limit, but we'll show a modal already.
            setLoggedOut(true);
            failedTokenExpiry = exp;
            failedCount++;
            return;
          },
        );
      } else if (!isTokenExpired(exp)) {
        // Access token is not expired yet. If any modal is currently visible,
        // hide it
        setLoggedOut(false);
      }
      // When we are authenticated (`exp !== undefined`) we want to refresh the token
      // `minValidity` seconds before it expires. If there's no token we recheck this
      // condition every 60 seconds.
      // `Math.max` ensures that we don't call startTimer too often even when the
      // token needs to be refreshed, for example during a retry loop after a
      // failed token refresh, or when the refresh token is expired. In both
      // cases we don't want to stop the timer forever, since another tab may
      // revalidate the tokens.
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
  const [quickSearchFilter, setQuickSearchFilter] = useState<QuickSearchFilter|undefined>(undefined);

  const loadUnreadCount = async () => {
    // Notifications will be polled at regular intervals. When the auth token
    // nears expiry, the auth timer should refresh it automatically. But while
    // the refresh is taking place, or if refresh failed, or if the user isn't
    // logged in at all, we don't want to poll notifications -- without a valid
    // token it'll 100% fail. So we don't fire a request in that case.
    // Technically this kind of check would be useful to have for every authed
    // API endpoint, but it requires a lot of coordination with the backend
    // (e.g. category list fetch should go ahead without auth, but exam list
    // should not). This unreadcount request in particular is polled quite
    // frequently by every page, and has previously caused lots of unnecessary
    // requests to fire while the user was idle. So we pick on it in particular.
    const { token: exp } = getAuthenticationExpiry();
    if (exp && !isTokenExpired(exp))
      return (await fetchGet("/api/notification/unreadcount/")).value as number;
    return undefined;
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
    { title: "Flagged Content", href: "/flagged"},
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
        <Button size="lg" onClick={() => login()}>
          Sign in with AAI
        </Button>
      </Modal>
      <Route children={<HashLocationHandler />} />
      <DebugContext.Provider value={debugOptions}>
        <UserContext.Provider value={user}>
          <SetUserContext.Provider value={setUser}>
            <QuickSearchFilterContext.Provider value={{ filter: quickSearchFilter, setFilter: setQuickSearchFilter }}>
              <div>
                <TopHeader
                  logo={data.logo ?? defaultConfigOptions.logo}
                  size="xl"
                  orgHomepage={
                    /** Keep this '/' for backwards compatibility, until all fachvereine add hompage links to vseth static config
                     * Once all fachvereine added that config, oen should change it to default
                     */
                    data.homepage ?? "/"
                  }
                  organizationNav={
                    data.externalNav ?? defaultConfigOptions.externalNav
                  }
                  selectedLanguage={"en"}
                  onLanguageSelect={() => { }}
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
                <AnnouncementHeader />
                <Box component="main" mt="2em">
                  <Router>
                    <Switch>
                      <UserRoute exact path="/" children={<HomePage />} />
                      <UserRoute
                        exact
                        path="/uploadpdf"
                        children={<UploadPdfPage />}
                      />
                      <UserRoute
                        exact
                        path="/submittranscript"
                        children={<UploadTranscriptPage />}
                      />
                      <UserRoute exact path="/faq" children={<FAQ />} />
                      <UserRoute
                        exact
                        path="/feedback"
                        children={<FeedbackPage />}
                      />
                      <UserRoute
                        path="/category/:slug"
                        children={<CategoryPage />}
                      />
                      <UserRoute
                        exact
                        path="/user/:author/document/:slug"
                        children={<DocumentPage />}
                      />
                      <UserRoute
                        path="/exams/:filename"
                        children={<ExamPage />}
                      />
                      <UserRoute
                        exact
                        path="/user/:username"
                        children={<UserPage />}
                      />
                      <UserRoute exact path="/user/" children={<UserPage />} />
                      <UserRoute
                        exact
                        path="/search/"
                        children={<SearchPage />}
                      />
                      <UserRoute
                        exact
                        path="/scoreboard"
                        children={<Scoreboard />}
                      />
                      <UserRoute
                        exact
                        path="/modqueue"
                        children={<ModQueue />}
                      />
                      <UserRoute
                        exact
                        path="/flagged"
                        children={<FlaggedContent />}
                      />
                      <Route exact path="/login" children={<LoginPage />} />
                      <Route children={<NotFoundPage />} />
                    </Switch>
                  </Router>
                </Box>
              </div>
              <Footer
                logo={data.logo ?? defaultConfigOptions.logo}
                disclaimer={data.disclaimer ?? defaultConfigOptions.disclaimer}
                privacy={data.privacy ?? defaultConfigOptions.privacy}
                orgHomepage={
                  /** Keep this '/' for backwards compatibility, until all fachvereine add hompage links to vseth static config
                   * Once all fachvereine added that config, oen should change it to default
                   */
                  data.homepage ?? "/"
                }
              />
            </QuickSearchFilterContext.Provider>
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
