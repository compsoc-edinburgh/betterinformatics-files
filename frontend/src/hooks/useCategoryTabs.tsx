import { Badge, Button, Group } from "@mantine/core";
import { useMemo } from "react";
import { Link, useRouteMatch } from "react-router-dom";

export const useCategoryTabs = (tabs: { name: string; id: string, count?: number, disabled?: boolean }[]) => {
  // Get tab ID from URL query parameters if it exists.
  // We have to use `useRouteMatch` instead of the typical `useParams`, and have
  // to explicitly pass the path to match, because `useCategoryTabs` is to be
  // used outside of the matching route component in CategoryPage.
  const match = useRouteMatch<{ tab?: string }>("/category/:slug/:tab?");

  // Default to the first tab if no tab is specified
  const currentTab = match?.params?.tab || tabs[0]?.id;

  // Current base URL is used for constructing links to other tabs
  const { url } = useRouteMatch();

  // Create the tab items
  const Component = useMemo(
    () => (
      <Group gap={0} ml="xs" align="stretch">
        {tabs.map((tab, i) => (
          <Button
            key={tab.id}
            variant="transparent"
            px="md"
            py="sm"
            style={{
              borderTop: "3px solid transparent", // to even out the height
              borderBottom: `3px solid ${currentTab === tab.id ? "var(--mantine-primary-color-filled)" : "transparent"}`,
              height: "auto",
              backgroundColor: "transparent",
            }}
            color={currentTab === tab.id ? "var(--mantine-color-text)" : "var(--mantine-color-dimmed)"}
            radius={0}
            component={Link}
            to={i > 0 ? `${url}/${tab.id}` : url} // If it's the first tab, hide ID for cleaner URL
            data-disabled={tab.disabled}
            title={tab.disabled ? "This feature is currently unavailable" : undefined}
            onClick={tab.disabled ? (event) => event.preventDefault() : undefined}
            rightSection={tab.count !== undefined ? <Badge size="sm" fz="sm">{tab.count}</Badge> : null}
          >
            {tab.name}
          </Button>
        ))}
      </Group>
    ),
    [tabs, currentTab, url],
  );

  return { currentTab, Component };
}
