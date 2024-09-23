import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Card,
  Group,
  Text,
  Title,
} from "@mantine/core";
import moment from "moment";
import * as React from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useMarkAllAsRead } from "../api/hooks";
import GlobalConsts from "../globalconsts";
import { NotificationInfo } from "../interfaces";
import MarkdownText from "./markdown-text";
import { IconLink } from "@tabler/icons-react";
interface Props {
  notification: NotificationInfo;
}

const NotificationComponent: React.FC<Props> = ({ notification }) => {
  const [error, , markAllAsRead] = useMarkAllAsRead();
  useEffect(() => {
    if (!notification.read) markAllAsRead(notification.oid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification.oid, notification.read]);

  return (
    <div>
      {error && <Alert color="red">{error.message}</Alert>}
      <Card withBorder shadow="md" my="sm">
        <Card.Section p="md" mb="md" withBorder>
          <Group justify="space-between">
            <div>
              <Title order={4}>
                <Anchor component={Link} to={notification.link}>
                  {notification.title}
                </Anchor>
              </Title>
              <Group gap={0}>
                <Anchor component={Link} to={notification.sender}>
                  {notification.senderDisplayName}
                </Anchor>
                <Text mx={6} component="span">
                  •
                </Text>
                <Text>
                  {moment(
                    notification.time,
                    GlobalConsts.momentParseString,
                  ).format(GlobalConsts.momentFormatString)}
                </Text>
                {!notification.read && (
                  <Badge ml="sm" component="span" color="red">
                    Unread
                  </Badge>
                )}
              </Group>
            </div>
            <ActionIcon component={Link} to={notification.link}>
              <IconLink />
            </ActionIcon>
          </Group>
        </Card.Section>
        <MarkdownText value={notification.message} />
      </Card>
    </div>
  );
};
export default NotificationComponent;
