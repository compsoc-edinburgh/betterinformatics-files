import React from "react";
import { Anchor, MantineColor, MantineSize, Text } from "@mantine/core";
import displayNameClasses from "../utils/display-name.module.css";
import { PageAuthorResponse } from "../api/model";
import { Link } from "react-router-dom";

interface PageUserRenderProps {
  user: PageAuthorResponse;
  can_see_anonymised?: boolean;
  size?: MantineSize;
  c?: MantineColor;
}

export const PageUserRender: React.FC<PageUserRenderProps> = ({
  user,
  can_see_anonymised,
  size,
  c,
}) => {
  return (
    <Text
      size={size}
      c={c}
      component="span"
      style={{ wordBreak: "break-word" }}
    >
      {!user.anonymised && user.username && (
        <Anchor
          component={Link}
          to={`/user/${user.username}`}
          underline="never"
          className={displayNameClasses.shrinkableDisplayName}
          c="inherit"
        >
          {user.display_name !== user.username && (
            <>
              <Text component="span">{user.display_name}</Text>
              <Text ml="0.3em" c="dimmed" component="span">
                @{user.username}
              </Text>
            </>
          )}
          {user.display_name === user.username && (
            <Text component="span">@{user.username}</Text>
          )}
        </Anchor>
      )}
      {!user.anonymised && !user.username && (
        <Text component="span">{user.display_name}</Text>
      )}
      {user.anonymised && <Text component="span">Anonymous</Text>}
      {user.anonymised && user.username && can_see_anonymised && (
        <Anchor
          component={Link}
          to={`/user/${user.username}`}
          underline="never"
          className={displayNameClasses.shrinkableDisplayName}
        >
          <Text ml="0.3em" c="dimmed" component="span">
            ({user.display_name !== user.username && `${user.display_name} `}@
            {user.username})
          </Text>
        </Anchor>
      )}
      {user.anonymised && !user.username && can_see_anonymised && (
        <Text ml="0.3em" c="dimmed" component="span">
          ({user.display_name})
        </Text>
      )}
    </Text>
  );
};
