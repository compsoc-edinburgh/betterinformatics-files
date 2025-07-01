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
import { fetchGet, getCookie } from "./api/fetch-utils";
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
import TestimonialsPage from "./pages/testimonials-page";

function calculateShades(primaryColor: string): MantineColorsTuple {
  var baseHSLcolor = tinycolor(primaryColor).toHsl();
  var darkerRatio = (0.95 - baseHSLcolor.l) / 7.0;
  var shadesArray = new Array(10);
  for (var i = 0; i < 7; i++) {
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

  const loadUnreadCount = async () => {
    return (await fetchGet("/api/notification/unreadcount/")).value as number;
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
  var compsocTheme = createTheme({
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
  ];

  const bottomHeaderNav = [
    { title: "Home", href: "/" },
    { title: "Search", href: "/search" },
    { title: "Testimonials", href:"/testimonials"},
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
            <div>
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
                      path="/upload-dissertation"
                      component={UploadDissertationPage}
                    />
                    <UserRoute
                      exact
                      path="/dissertations"
                      component={DissertationListPage}
                    />
                    <UserRoute
                      exact
                      path="/testimonials"
                      component={TestimonialsPage}
                    />
                    <UserRoute
                      exact
                      path="/dissertations/:id"
                      component={DissertationDetailPage}
                    />
                    <UserRoute exact path="/faq" component={FAQ} />
                    <Route
                      exact
                      path="/disclaimer"
                      component={DisclaimerPage}
                    />
                    <Route
                      exact
                      path="/privacy"
                      component={PrivacyPolicyPage}
                    />
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
                      path="/document/:slug"
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
                    <UserRoute
                      exact
                      path="/stats"
                      render={() => <Redirect to="/scoreboard" />}
                    />
                    <UserRoute exact path="/modqueue" component={ModQueue} />
                    <Route component={NotFoundPage} />
                  </Switch>
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
            </div>
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
