import { useLocalStorage } from "@mantine/hooks";
import { latestVersion } from "../utils/changelog";

const STORAGE_KEY = "last-seen-changelog-version";

export const useChangelog = () => {
  const [lastSeen, setLastSeen] = useLocalStorage<string | null>({
    key: STORAGE_KEY,
    defaultValue: null,
    getInitialValueInEffect: false,
    sync: false,
  });

  if (!latestVersion)
    return {
      hasNew: false,
      lastSeen,
      dismiss: () => {
        /* empty */
      },
    };
  const hasNew = lastSeen !== latestVersion;

  return {
    hasNew,
    lastSeen,
    dismiss: () => {
      if (latestVersion) setLastSeen(latestVersion);
    },
  };
};
