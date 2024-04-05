import {
  CloseButton,
  Combobox,
  ComboboxItem,
  InputBase,
  ScrollArea,
  useCombobox,
} from "@mantine/core";
import { ReactNode, useState } from "react";
import classes from "./creatable.module.css";

interface CreatableProps {
  clearable?: boolean;
  disabled?: boolean;
  placeholder?: string;
  title: string;
  data: (string | ComboboxItem)[];
  onCreate: (query: string) => string | ComboboxItem;
  value: string;
  onChange: (value: string) => void;
  getCreateLabel: (query: string) => ReactNode;
}

const Creatable: React.FC<CreatableProps> = ({
  clearable,
  disabled,
  placeholder,
  title,
  data,
  onCreate,
  value,
  onChange,
  getCreateLabel,
}) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const [search, setSearch] = useState(value === undefined ? "" : value);

  const exactOptionMatch = data.some(item => {
    return typeof item === "string" ? item === search : item.value === search;
  });
  const filteredOptions = exactOptionMatch
    ? data
    : data.filter(item =>
        typeof item === "string"
          ? item.toLowerCase().includes(search.toLowerCase().trim())
          : item.value.toLowerCase().includes(search.toLowerCase().trim()) ||
            item.label.toLowerCase().includes(search.toLowerCase().trim()),
      );

  const options = filteredOptions.map((item, i) => {
    return typeof item === "string" ? (
      <Combobox.Option value={item} key={i}>
        {item}
      </Combobox.Option>
    ) : (
      <Combobox.Option value={item.value} key={i}>
        {item.label}
      </Combobox.Option>
    );
  });

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={val => {
        if (val === "$create") {
          onCreate(search);
          onChange(search);
        } else {
          onChange(val);
          setSearch(val);
        }

        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          label={title}
          disabled={disabled}
          title={title}
          pointer
          rightSection={
            clearable && value !== null && value !== undefined ? (
              <CloseButton
                size="sm"
                onMouseDown={event => event.preventDefault()}
                className={classes.closeBtn}
                onClick={() => {
                  onChange("");
                  setSearch("");
                }}
                aria-label="Clear value"
              />
            ) : (
              <Combobox.Chevron />
            )
          }
          rightSectionPointerEvents={value === null ? "none" : "all"}
          value={search}
          onChange={event => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
            onChange(event.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch(value || "");
            onChange(value || "");
          }}
          placeholder={placeholder}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <ScrollArea.Autosize
          mah={220}
          type="scroll"
          scrollbarSize="var(--_combobox-padding)"
          offsetScrollbars="y"
          className={classes.optionsDropdownScrollArea}
        >
          {options}
        </ScrollArea.Autosize>

        <Combobox.Options>
          {!exactOptionMatch && search.trim().length > 0 && (
            <Combobox.Option value="$create">
              {getCreateLabel(search)}
            </Combobox.Option>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};
export default Creatable;
