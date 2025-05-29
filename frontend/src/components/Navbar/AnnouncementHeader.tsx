import * as React from "react";
import { useEffect } from "react";
import { Alert, Container, Text } from "@mantine/core";
import serverData from "../../utils/server-data";
import { IconAlertCircle, IconBell, IconCheck, IconConfetti, IconInfoCircle } from "@tabler/icons-react";
import { useLocalStorage } from "@mantine/hooks";


const AnnouncementHeader: React.FC = () => {
  const [dismissed, setDismissed] = useLocalStorage({
    key: "dismissed-announcements",
    defaultValue: new Set<String>(),
    getInitialValueInEffect: false,
    serialize: (it) => JSON.stringify([...it]),
    deserialize: (it) => {
      let parsedIds: string[] = [];
      try {
        parsedIds = JSON.parse(it ?? "[]");
      } catch (e: any) {
        console.error("Could not parse dismissed announcement ids! Ignoring and deleting current value!", e);
      }
      return new Set(parsedIds);
    },
  });

  useEffect(() => {
    const currentDismissed = serverData.announcements
      .map(it => it.id)
      .filter(it => dismissed.has(it));

    if (currentDismissed.length < dismissed.size)
      setDismissed(new Set(currentDismissed));

  }, [dismissed, serverData.announcements]);

  const announcements = serverData.announcements.map(it =>
    (!(dismissed.has(it.id))) && (< Alert
      icon={
        it.icon === "info" ? (<IconInfoCircle />) :
          it.icon === "alert" ? (<IconAlertCircle />) :
            it.icon === "check" ? (<IconCheck />) :
              it.icon === "confetti" ? (<IconConfetti />) :
                (<IconBell />)
      }

      color={it.color}
      variant={it.variant ?? "light"}
      title={it.title}
      withCloseButton
      onClose={() => {
        setDismissed(new Set([it.id, ...dismissed]));
      }}
      key={it.id}
      m="md"
    >
      <Text>{it.content}</Text>
    </Alert>)
  );

  return (
    <Container fluid={true}>
      <Container size="xl">
        {announcements}
      </Container>
    </Container>
  );
};

export default AnnouncementHeader;
