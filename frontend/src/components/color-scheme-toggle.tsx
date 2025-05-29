import { useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { Button } from "@mantine/core";

const ColorSchemeToggle = () => {
  const { colorScheme, setColorScheme} = useMantineColorScheme();
  return (
    <>
      <Button darkHidden variant="transparent" leftSection={<IconMoon/>} onClick={() => {setColorScheme("dark")}}/>
      <Button lightHidden variant="transparent" leftSection={<IconSun/>} onClick={() => {setColorScheme("light")}}/>
    </>
  );
};

export default ColorSchemeToggle;
