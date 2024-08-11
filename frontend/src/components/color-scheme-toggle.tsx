import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

const ColorSchemeToggle = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";
  return (
    <ActionIcon
      color="white"
      onClick={() => toggleColorScheme()}
      title="Toggle color scheme"
      variant="transparent"
    >
      {dark ? <IconSun /> : <IconMoon />}
    </ActionIcon>
  );
};

export default ColorSchemeToggle;