import { Badge, Button, Group } from "@mantine/core";
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

export const useCategoryTabs = (tabs: { name: string; id: string, count?: number, disabled?: boolean }[]) => {
  // Get tab ID from URL query parameters if it exists
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const currentTab = params.get("tab") || tabs[0].id;

  // Create the tab items
  const Component = useMemo(
    () => (
      <Group gap={0} ml="xs" align="stretch">
        {tabs.map((tab) => (
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
            to={`?tab=${tab.id}`}
            data-disabled={tab.disabled}
            title={tab.disabled ? "This feature is currently unavailable" : undefined}
            onClick={tab.disabled ? (event) => event.preventDefault() : undefined}
            rightSection={tab.count !== undefined ? <Badge size="sm">{tab.count}</Badge> : null}
          >
            {tab.name}
          </Button>
        ))}
      </Group>
    ),
    [tabs, currentTab],
  );

  return { currentTab, Component };
}
