import {
  Group,
  HoverCard,
  Text,
  useMantineColorScheme,
  Button,
} from "@mantine/core";
import { IconMoon, IconSun, IconSunMoon } from "@tabler/icons-react";

const ColorSchemeToggle = () => {
  const { colorScheme, setColorScheme, clearColorScheme } =
    useMantineColorScheme();
  return (
    <Group justify="center">
      <HoverCard
        shadow="md"
        withArrow
        openDelay={100}
        closeDelay={100}
        disabled={colorScheme == "auto"}
      >
        <HoverCard.Target>
          <Group>
            <Button
              darkHidden
              variant="transparent"
              onClick={() => {
                setColorScheme("dark");
              }}
              pr={0}
            >
              <IconMoon />
            </Button>
            <Button
              lightHidden
              variant="transparent"
              onClick={() => {
                setColorScheme("light");
              }}
              pr={0}
            >
              <IconSun />
            </Button>
          </Group>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Group>
            <Text>Follow system theme: </Text>
            <Button
              variant="transparent"
              leftSection={<IconSunMoon />}
              onClick={() => {
                setColorScheme("auto");
              }}
            />
          </Group>
        </HoverCard.Dropdown>
      </HoverCard>
    </Group>
  );
};

export default ColorSchemeToggle;
