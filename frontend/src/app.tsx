import {
  Button,
  MantineProvider,
  Box,
  Affix,
  rem,
  createTheme,
  Indicator,
  MantineColorsTuple,
  CSSVariablesResolver,
  SegmentedControl,
} from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import React, { useEffect, useState } from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import tinycolor from "tinycolor2";
import { authenticated, fetchGet, getCookie } from "./api/fetch-utils";
import { notLoggedIn, SetUserContext, User, UserContext } from "./auth";
import UserRoute from "./auth/UserRoute";
import { DebugContext, defaultDebugOptions } from "./components/Debug";
import DebugModal from "./components/Debug/DebugModal";
import HashLocationHandler from "./components/hash-location-handler";
import CategoryPage from "./pages/category-page";
import DisclaimerPage from "./pages/disclaimer-page";
import DocumentPage from "./pages/document-page";
import ExamPage from "./pages/exam-page";
import FAQ from "./pages/faq-page";
import FeedbackPage from "./pages/feedback-page";
import HomePage from "./pages/home-page";
import LoginPage from "./pages/login-page";
import ModQueue from "./pages/modqueue-page";
import UploadDissertationPage from "./pages/UploadDissertationPage";
import DissertationListPage from "./pages/DissertationListPage";
import DissertationDetailPage from "./pages/DissertationDetailPage";
import NotFoundPage from "./pages/not-found-page";
import PrivacyPolicyPage from "./pages/privacypolicy-page";
import Scoreboard from "./pages/scoreboard-page";
import SearchPage from "./pages/search-page";
import UploadPdfPage from "./pages/uploadpdf-page";
import UserPage from "./pages/userinfo-page";
import { useLocalStorageState, useRequest } from "@umijs/hooks";
import { BooleanParam, useQueryParam } from "use-query-params";
import BottomHeader from "./components/Navbar/BottomHeader";
import MobileHeader from "./components/Navbar/MobileHeader";
import Footer from "./components/footer";
import {
  ConfigOptions,
  defaultConfigOptions,
} from "./components/Navbar/constants";
import { useDisclosure } from "@mantine/hooks";
import AnnouncementHeader from "./components/Navbar/AnnouncementHeader";
import FlaggedContent from "./pages/flagged-content";
import { FaroRoute } from "@grafana/faro-react";
import serverData from "./utils/server-data";
import {
  QuickSearchFilter,
  QuickSearchFilterContext,
} from "./components/Navbar/QuickSearch/QuickSearchFilterContext";

function calculateShades(primaryColor: string): MantineColorsTuple {
  const baseHSLcolor = tinycolor(primaryColor).toHsl();
  const darkerRatio = (0.95 - baseHSLcolor.l) / 7.0;
  const shadesArray = new Array(10);
  for (let i = 0; i < 7; i++) {
    shadesArray[i] = tinycolor({
      h: baseHSLcolor.h,
      s: baseHSLcolor.s,
      l: 0.95 - i * darkerRatio,
    }).toString("hex6");
  }
  shadesArray[7] = primaryColor;
  shadesArray[8] = tinycolor({
    h: baseHSLcolor.h,
    s: baseHSLcolor.s,
    l: 0.05 + (baseHSLcolor.l - 0.05) / 2.0,
  }).toString("hex6");
  shadesArray[9] = tinycolor({
    h: baseHSLcolor.h,
    s: baseHSLcolor.s,
    l: 0.05,
  }).toString("hex6");
  return shadesArray as unknown as MantineColorsTuple;
}

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
  const [quickSearchFilter, setQuickSearchFilter] = useState<
    QuickSearchFilter | undefined
  >(undefined);

  const loadUnreadCount = async () => {
    if (authenticated())
      return (await fetchGet("/api/notification/unreadcount/")).value as number;
    return undefined;
  };
  const { data: unreadCount } = useRequest(loadUnreadCount, {
    pollingInterval: 300_000,
  });

  // Update local storage if a new uwu query parameter is set
  const [uwu, setLocalUwu] = useLocalStorageState("uwu", false);
  const [newUwu, _] = useQueryParam("uwu", BooleanParam);
  if (newUwu !== null && newUwu !== undefined && uwu !== newUwu)
    setLocalUwu(newUwu);

  // Retrieve the config options (such as the logo, global menu items, etc) from
  // the global configOptions variable if set (in index.html). The defaults are
  // for VSETH and are not to be used for Edinburgh CompSoc.
  const configOptions = (window as any).configOptions as ConfigOptions;

  // CompSoc theme
  const compsocTheme = createTheme({
    colors: {
      // A brown-like color for the primary color
      compsocMain: calculateShades("#b89c7c"),
      // Various tones of gray for miscellaneous elements
      compsocGray: new Array(10).fill(
        "rgb(144, 146, 150)",
      ) as unknown as MantineColorsTuple,
    },
    primaryColor: "compsocMain",
    primaryShade: 7,
    fontFamily:
      '"Source Sans Pro",Lato,Arial,Helvetica,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol',
    lineHeights: {
      base: "1.5",
    },
    autoContrast: true,
    luminanceThreshold: 0.4,
  });

  compsocTheme.components = {
    Badge: {
      defaultProps: {
        color: "compsocGray",
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
    { title: "Upload Dissertation", href: "/upload-dissertation" },
    { title: "Mod Queue", href: "/modqueue" },
    { title: "Flagged Content", href: "/flagged" },
  ];

  const bottomHeaderNav = [
    { title: "Home", href: "/" },
    { title: "Dissertations", href: "/dissertations" },
    {
      title: "More",
      childItems: [
        { title: "FAQ", href: "/faq" },
        { title: "Stats and Scores", href: "/stats" },
        { title: "Feedback", href: "/feedback" },
        ...(typeof user === "object" && user.isCategoryAdmin ? adminItems : []),
      ],
    },
    {
      title: (
        <Indicator
          disabled={unreadCount === undefined || unreadCount === 0}
          label={unreadCount}
        >
          Account
        </Indicator>
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
    <MantineProvider theme={compsocTheme} cssVariablesResolver={resolver}>
      <Route component={HashLocationHandler} />
      <DebugContext.Provider value={debugOptions}>
        <UserContext.Provider value={user}>
          <SetUserContext.Provider value={setUser}>
            <QuickSearchFilterContext.Provider
              value={{
                filter: quickSearchFilter,
                setFilter: setQuickSearchFilter,
              }}
            >
              <div>
                <BottomHeader
                  lang={"en"}
                  appNav={bottomHeaderNav}
                  title={"File Collection"}
                  size="xl"
                  icon={configOptions.logo}
                />
                <MobileHeader
                  signet={configOptions.logo ?? defaultConfigOptions.logo}
                  selectedLanguage={"en"}
                  appNav={bottomHeaderNav}
                  title={"File Collection"}
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
                        path="/upload-dissertation"
                        children={<UploadDissertationPage />}
                      />
                      <UserRoute
                        exact
                        path="/dissertations"
                        children={<DissertationListPage />}
                      />
                      <UserRoute
                        exact
                        path="/dissertations/:id"
                        children={<DissertationDetailPage />}
                      />
                      <UserRoute exact path="/faq" children={<FAQ />} />
                      <Route
                        exact
                        path="/disclaimer"
                        children={<DisclaimerPage />}
                      />
                      <Route
                        exact
                        path="/privacy"
                        children={<PrivacyPolicyPage />}
                      />
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
                        path="/document/:slug"
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
                        path="/stats"
                        render={() => <Redirect to="/scoreboard" />}
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
                logo={configOptions.logo ?? defaultConfigOptions.logo}
                disclaimer={
                  configOptions.disclaimer ?? defaultConfigOptions.disclaimer
                }
                privacy={configOptions.privacy ?? defaultConfigOptions.privacy}
                organizationNav={
                  configOptions.externalNav ?? defaultConfigOptions.externalNav
                }
                orgHomepage={
                  /** Keep this '/' for backwards compatibility, until all fachvereine add hompage links to vseth static config
                   * Once all fachvereine added that config, oen should change it to default
                   */
                  configOptions.homepage ?? "/"
                }
              />
            </QuickSearchFilterContext.Provider>
          </SetUserContext.Provider>
        </UserContext.Provider>
      </DebugContext.Provider>
      {process.env.NODE_ENV === "development" && (
        <>
          <Affix position={{ top: rem(10), left: rem(10) }}>
            <Button variant="brand" onClick={toggleDebugPanel}>
              DEBUG
            </Button>
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
