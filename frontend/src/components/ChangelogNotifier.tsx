import * as React from "react";
import { useEffect } from "react";
import { Button, Group, Modal } from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { Link } from "react-router-dom";
import { entriesSince, latestVersion } from "../utils/changelog";
import { useUser } from "../auth";
import MarkdownText from "./markdown-text";

const STORAGE_KEY = "last-seen-changelog-version";

const ChangelogNotifier: React.FC = () => {
  const user = useUser();
  const [lastSeen, setLastSeen] = useLocalStorage<string | null>({
    key: STORAGE_KEY,
    defaultValue: null,
    getInitialValueInEffect: false,
  });
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    if (!latestVersion || !user?.loggedin) return;
    if (lastSeen === null) {
      setLastSeen(latestVersion);
      return;
    }
    if (lastSeen !== latestVersion) open();
  }, [lastSeen, open, setLastSeen, user?.loggedin]);

  const dismiss = () => {
    if (latestVersion) setLastSeen(latestVersion);
    close();
  };

  if (!latestVersion) return null;

  return (
    <Modal opened={opened} onClose={dismiss} title="What's New" size="lg">
      <MarkdownText value={entriesSince(lastSeen ?? undefined)} />
      <Group justify="flex-end" mt="md">
        <Button component={Link} to="/changelog" variant="default" onClick={dismiss}>
          Full changelog
        </Button>
        <Button onClick={dismiss}>Got it</Button>
      </Group>
    </Modal>
  );
};

export default ChangelogNotifier;
