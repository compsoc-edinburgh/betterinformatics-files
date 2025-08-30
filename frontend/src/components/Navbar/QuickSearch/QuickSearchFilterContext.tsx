import { createContext, useContext, useEffect } from "react";

export interface QuickSearchFilter {
  slug: string, // Category slug
  displayname: string; // Category display name
};

// Provide React Contexts so components across the app can call
// useQuickSearchFilter({slug, displayname});
export const QuickSearchFilterContext = createContext<{
  filter?: QuickSearchFilter,
  setFilter: (filter?: QuickSearchFilter) => void,
} | undefined>(undefined);

/**
 * Set the category filter for the site-wide quick search bar.
 * When the component that calls the hook gets unloaded, the filter is reverted
 * back to undefined, regardless of whatever value it was set to by any parent
 * before you called the hook.
 * @param slug Must be a valid category slug, passed to the backend to filter
 * quick-search results
 * @param displayname Used in UI to show the dropdown text in the quick-search bar
 */
export const useQuickSearchFilter = (filter?: QuickSearchFilter) => {
  const { filter: currentFilter, setFilter } = useContext(QuickSearchFilterContext) ?? {};
  useEffect(() => {
    // Context may be undefined if there is no QuickSearchFilterContext in
    // the parent tree. If so, we won't do anything nor return cleanups.
    if (!setFilter) return;

    // Prevent re-renders caused by passing a new object if the child values are
    // the same. Otherwise, since the object passed to this hook is newly created
    // every render, useEffect will trigger, setFilter will trigger, re-render
    // is triggered by context value changing, which causes useEffect to trigger
    // etc...
    // The fix is to stop the recursion if our desired result is already set
    if (filter?.slug === currentFilter?.slug) return;

    setFilter(filter);
    return () => {
      // Cleanup function that runs whenever deps list changes or component
      // unloads. We have to do a check here as well that the desired state is
      // not the current state, otherwise there will be an infinite loop where
      // setFilter(undefined) will cause a context re-render, which will cause
      // the hook to be unloaded, which calls useEffect's return callback, which
      // sets setFilter(undefined) again.
      if (currentFilter !== undefined) setFilter(undefined);
    }
  }, [currentFilter, filter, setFilter]);
}
