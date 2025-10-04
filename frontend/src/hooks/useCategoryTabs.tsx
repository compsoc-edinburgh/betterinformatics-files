import { Badge, Button, Group, Tooltip } from "@mantine/core";
import { useEffect, useMemo } from "react";
import { Link, useHistory, useRouteMatch } from "react-router-dom";

export const useCategoryTabs = (
  tabs: { name: string; id: string; count?: number; disabled?: boolean }[],
) => {
  // Get tab ID from URL query parameters if it exists.
  // We have to use `useRouteMatch` instead of the typical `useParams`, and have
  // to explicitly pass the path to match, because `useCategoryTabs` is to be
  // used outside of the matching route component in CategoryPage.
  const match = useRouteMatch<{ tab?: string }>("/category/:slug/:tab?");

  const currentTab = tabs.find(tab => tab.id === match?.params?.tab) || tabs[0];

  // Current base URL is used for constructing links to other tabs
  const { url } = useRouteMatch();
  const history = useHistory();

  useEffect(() => {
    // If the current tab is disabled, we redirect to the first enabled tab
    if (currentTab.disabled) {
      const i = tabs.findIndex((tab, i) => !tab.disabled);
      if (i !== -1) {
        // Redirect to the first enabled tab (if first, don't append ID to URL)
        history.push(i > 0 ? `${url}/${tabs[i].id}` : url);
      }
    }
  }, [currentTab, tabs, history, url]);

  // If tab is disabled or undefined (not found), default to the first enabled tab
  // If no tabs are enabled, default to the first tab in the list
  const currentTabId = currentTab.id;

  // Create the tab items
  const Component = useMemo(
    () => (
      <Group
        gap={0}
        ml="xs"
        align="stretch"
        display="inline-flex"
        wrap="nowrap"
      >
        {tabs.map((tab, i) => (
          <Tooltip
            label={"This feature is currently unavailable"}
            disabled={!tab.disabled}
            key={tab.id}
            openDelay={200}
          >
            <Button
              variant="transparent"
              px="md"
              py="sm"
              styles={{
                root: {
                  borderTop: "3px solid transparent", // to even out the height
                  borderBottom: `3px solid ${currentTabId === tab.id ? "var(--mantine-primary-color-filled)" : "transparent"}`,
                  height: "auto",
                  backgroundColor: "transparent",
                  opacity: tab.id === currentTabId ? 1 : 0.75,
                },
                label: {
                  textDecoration: tab.disabled ? "line-through" : "inherit",
                },
              }}
              color={
                !tab.disabled
                  ? "var(--mantine-color-text)"
                  : "var(--mantine-color-dimmed)"
              }
              radius={0}
              component={Link}
              to={i > 0 ? `${url}/${tab.id}` : url} // If it's the first tab, hide ID for cleaner URL
              data-disabled={tab.disabled}
              onClick={
                tab.disabled ? event => event.preventDefault() : undefined
              }
              rightSection={
                tab.count !== undefined ? (
                  <Badge size="sm" fz="sm">
                    {tab.count}
                  </Badge>
                ) : null
              }
            >
              {tab.name}
            </Button>
          </Tooltip>
        ))}
      </Group>
    ),
    [tabs, currentTabId, url],
  );

  return { currentTabId, Component };
};
