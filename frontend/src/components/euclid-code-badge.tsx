import {
  Badge,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Text,
} from "@mantine/core";

/**
 * Component to display a badge for a course code, with hover information.
 * It takes in a EUCLID code, and dynamically loaded course data as well as the
 * loading/error states for it.
 */
export const EuclidCodeBadge = ({
  code,
  badge_data,
  loading,
  error,
}: {
  code: string;
  badge_data:
    | undefined
    | {
        name: string;
        level: number;
        delivery_ordinal: number;
        course_url: string;
        euclid_url: string;
        shadow?: string;
      };
  loading: boolean;
  error: any;
}) => {
  return (
    <HoverCard shadow="md" styles={{ dropdown: { maxWidth: 300 } }}>
      <HoverCardTarget>
        <Badge
          // Will show red if data isn't available or still loading
          color={badge_data ? "violet" : "red"}
          radius="xs"
          component="a"
          // Choose course URL over EUCLID URL
          href={badge_data?.course_url ?? badge_data?.euclid_url}
          // Badges don't look clickable by default, use pointer
          styles={{
            root: {
              cursor: badge_data ? "pointer" : "default",
            },
          }}
        >
          {code}
        </Badge>
      </HoverCardTarget>
      {(badge_data || !loading) && (
        <HoverCardDropdown>
          <Text size="sm">
            {badge_data &&
              !badge_data.shadow &&
              `${badge_data.name} (SCQF ${badge_data.level}, Semester ${badge_data.delivery_ordinal})`}
            {badge_data &&
              badge_data.shadow &&
              `${badge_data.name} (Shadow of ${badge_data.shadow})`}
            {!loading && !badge_data && "Not Running"}
            {error && error.message}
          </Text>
        </HoverCardDropdown>
      )}
    </HoverCard>
  );
};
