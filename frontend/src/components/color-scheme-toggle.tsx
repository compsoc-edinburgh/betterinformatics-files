import { Flex, Group, HoverCard, Text, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun, IconSunMoon } from "@tabler/icons-react";
import { Button } from "@mantine/core";

const ColorSchemeToggle = () => {
  const { colorScheme, setColorScheme, clearColorScheme } = useMantineColorScheme();
  return (
    <Group justify="center">
      <HoverCard shadow="md" withArrow openDelay={100} closeDelay={100} disabled={colorScheme == "auto"}>
        <HoverCard.Target>
          <Group>
            <Button darkHidden variant="transparent" leftSection={<IconMoon />} onClick={() => { setColorScheme("dark") }} />
            <Button lightHidden variant="transparent" leftSection={<IconSun />} onClick={() => { setColorScheme("light") }} />
          </Group>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Group>
            <Text>Follow system theme: </Text>
            <Button variant="transparent" leftSection={<IconSunMoon />} onClick={() => { setColorScheme("auto") }} />
          </Group>
        </HoverCard.Dropdown>
      </HoverCard>
    </Group >
  );
};

export default ColorSchemeToggle;
