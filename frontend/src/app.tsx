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
import chroma from "chroma-js";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import tinycolor from "tinycolor2";
import { authenticated, fetchGet, getCookie } from "./api/fetch-utils";
import { notLoggedIn, SetUserContext, User, UserContext } from "./auth";
import { AuthenticatedRoutes } from "./auth/AuthenticatedRoutes";
import { DebugContext, defaultDebugOptions } from "./components/Debug";
import DebugModal from "./components/Debug/DebugModal";
import CategoryPage from "./pages/category-page";
import DisclaimerPage from "./pages/disclaimer-page";
import ChangelogPage from "./pages/changelog-page";
import DocumentPage from "./pages/document-page";
import ExamPage from "./pages/exam-page";
import FAQ from "./pages/faq-page";
import FeedbackPage from "./pages/feedback-page";
import HomePage from "./pages/home-page";
import LoginPage from "./pages/login-page";
import ModQueue from "./pages/modqueue-page";
import DissertationUploadPage from "./pages/dissertation-upload-page";
import DissertationListPage from "./pages/dissertation-list-page";
import DissertationDetailPage from "./pages/dissertation-detail-page";
import NotFoundPage from "./pages/not-found-page";
import PrivacyPolicyPage from "./pages/privacypolicy-page";
import Scoreboard from "./pages/scoreboard-page";
import SearchPage from "./pages/search-page";
import UploadPdfPage from "./pages/uploadpdf-page";
import UserPage from "./pages/userinfo-page";
import { useLocalStorageState, useRequest } from "ahooks";
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
import { FaroRoutes } from "@grafana/faro-react";
import serverData from "./utils/server-data";
import {
  QuickSearchFilter,
  QuickSearchFilterContext,
} from "./components/Navbar/QuickSearch/QuickSearchFilterContext";
import { useScrollToHash } from "./hooks/useScrollToHash";

export function calculateShades(color: string): MantineColorsTuple {
  const LIGHTNESS_MAP = [
    0.96, 0.907, 0.805, 0.697, 0.605, 0.547, 0.518, 0.445, 0.395, 0.34,
  ];
  const SATURATION_MAP = [0.32, 0.16, 0.08, 0.04, 0, 0, 0.04, 0.08, 0.16, 0.32];

  const colorObject = chroma(color);

  // Force primary color to be at index 7, which is different from Mantine
  // which puts it wherever it falls in the lightness map.
  const baseColorIndex = 7;

  const colors = LIGHTNESS_MAP.map(l => colorObject.set("hsl.l", l))
    .map(c => chroma(c))
    .map((c, i) => {
      const saturationDelta =
        SATURATION_MAP[i] - SATURATION_MAP[baseColorIndex];
      return saturationDelta >= 0
        ? c.saturate(saturationDelta)
        : c.desaturate(saturationDelta * -1);
    });

  colors[baseColorIndex] = chroma(color);

  return colors.map(c => c.hex()) as unknown as MantineColorsTuple;
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
const TelemetryRoutes =
  import.meta.env.VITE_FARO_DISABLE === "true" || !serverData.faro_url
    ? Routes
    : FaroRoutes;

const App: React.FC = () => {
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

  useScrollToHash();

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
      compsocGray: calculateShades("#909296"),
    },
    defaultRadius: "md",
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
    Checkbox: {
      defaultProps: {
        radius: "sm",
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
    Modal: {
      defaultProps: {
        removeScrollProps: {
          allowPinchZoom: true,
        },
      },
    },
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
        { title: "What's New", href: "/changelog" },
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
                  <TelemetryRoutes>
                    <Route path="*" element={<NotFoundPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/disclaimer" element={<DisclaimerPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route element={<AuthenticatedRoutes />}>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/uploadpdf" element={<UploadPdfPage />} />
                      <Route
                        path="/upload-dissertation"
                        element={<DissertationUploadPage />}
                      />
                      <Route
                        path="/dissertations"
                        element={<DissertationListPage />}
                      />
                      <Route
                        path="/dissertations/:id/*"
                        element={<DissertationDetailPage />}
                      />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/changelog" element={<ChangelogPage />} />
                      <Route path="/feedback" element={<FeedbackPage />} />
                      <Route
                        path="/category/:slug/*"
                        element={<CategoryPage />}
                      />
                      <Route
                        path="/document/:slug"
                        element={<DocumentPage />}
                      />
                      <Route path="/exams/:filename/*" element={<ExamPage />} />
                      <Route path="/user/:username" element={<UserPage />} />
                      <Route path="/user/" element={<UserPage />} />
                      <Route path="/search/" element={<SearchPage />} />
                      <Route path="/scoreboard" element={<Scoreboard />} />
                      <Route
                        path="/stats"
                        element={<Navigate to="/scoreboard" replace />}
                      />
                      <Route path="/modqueue" element={<ModQueue />} />
                      <Route path="/flagged" element={<FlaggedContent />} />
                    </Route>
                  </TelemetryRoutes>
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
