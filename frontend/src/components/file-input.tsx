import {
  ActionIcon,
  Badge,
  FileInput as FileInputCore,
  Flex,
} from "@mantine/core";
import React, { useRef, useState } from "react";
import { CloseIcon, FileUploadIcon } from "vseth-canine-ui";
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
      icon={<FileUploadIcon />}
      rightSection={
        value && (
          <ActionIcon onClick={() => onChange(undefined)}>
            <CloseIcon />
          </ActionIcon>
        )
      }
    />
    // <div className="form-control position-relative">
    //   {value ? (
    //     <>
    //       <Button onClick={() => onChange(undefined)} />
    //       {value.name} <Badge>{value.type}</Badge> <Badge>{value.size}</Badge>
    //     </>
    //   ) : (
    //     <>
    //       &nbsp;
    //       <Button
    //         className="position-absolute position-left"
    //         onClick={() => fileInputRef.current && fileInputRef.current.click()}
    //       >
    //         Choose File
    //       </Button>
    //       <input
    //         accept={props.accept}
    //         hidden
    //         type="file"
    //         onChange={e => {
    //           onChange((e.currentTarget.files || [])[0]);
    //           e.currentTarget.value = "";
    //         }}
    //         ref={fileInputRef}
    //       />
    //     </>
    //   )}
    // </div>
  );
};
export default FileInput;
