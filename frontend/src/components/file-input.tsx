import {
  ActionIcon,
  Badge,
  FileInput as FileInputCore,
  Flex,
} from "@mantine/core";
import { IconFileUpload, IconX } from "@tabler/icons-react";
import React, { useRef } from "react";
interface FileInputProps
  extends Omit<
    React.DetailedHTMLProps<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >,
    "value" | "onChange" | "contentEditable"
  > {
  value?: File;
  onChange: (newFile?: File) => void;
}
const Value = (file: File | null) => {
  if (!file) return <></>;
  return (
    <>
      {file.name} <Badge>{file.type}</Badge> <Badge>{file.size} B</Badge>
    </>
  );
};

const FileInput: React.FC<FileInputProps> = ({ value, onChange, ...props }) => {
  const fileInputRef = useRef<HTMLButtonElement>(null);
  return (
    <FileInputCore
      placeholder="Choose File"
      value={value ?? null}
      accept={props.accept}
      ref={fileInputRef}
      onChange={v => onChange(v ?? undefined)}
      valueComponent={({ value }) =>
        Array.isArray(value) ? (
          <Flex>{value.map(v => Value(v))}</Flex>
        ) : (
          Value(value)
        )
      }
      leftSection={<IconFileUpload />}
      rightSection={
        value && (
          <ActionIcon onClick={() => onChange(undefined)}>
            <IconX />
          </ActionIcon>
        )
      }
    />
  );
};
export default FileInput;
