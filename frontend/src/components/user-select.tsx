import { useState } from "react";
import { Select, Loader, Group, Text } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useUserSearch } from "../api/hooks/users";
import type { UserSchema } from "../api/model/userSchema";

interface UserSelectProps {
  label: string;
  value: UserSchema | null;
  onChange: (user: UserSchema | null) => void;
  filter?: (user: UserSchema) => boolean;
}

const UserSelect: React.FC<UserSelectProps> = ({
  onChange,
  value,
  label,
  filter = () => true,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);

  const { data: users, isLoading } = useUserSearch({
    q: debouncedSearch,
  });

  const selectData =
    users
      ?.filter(user => filter(user))
      ?.map(user => ({
        value: String(user.id),
        label: user.display_name,
        user,
      })) ?? [];

  if (value && !selectData.some(user => user.user.id === value.id)) {
    selectData.unshift({
      value: String(value.id),
      label: value.display_name,
      user: value,
    });
  }

  return (
    <Select
      label={label}
      placeholder="Search name or username..."
      searchable
      searchValue={searchValue}
      onSearchChange={value => {
        setSearchValue(value);
      }}
      data={selectData}
      rightSection={isLoading ? <Loader size="xs" /> : null}
      // Filter only in backend
      filter={({ options }) => options}
      clearable
      value={value ? String(value.id) : null}
      renderOption={({ option }) => {
        const user = (option as unknown as { user: UserSchema }).user;

        return (
          <Group gap="sm">
            <Text size="sm">{user.display_name}</Text>
            <Text size="xs" c="dimmed">
              @{user.username}
            </Text>
          </Group>
        );
      }}
      onChange={(_selectedValue, option) => {
        const user = (option as unknown as { user: UserSchema } | undefined)
          ?.user;
        onChange(user ?? null);
      }}
    />
  );
};

export default UserSelect;
