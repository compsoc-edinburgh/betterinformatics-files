import { Badge, Input } from "@vseth/components";
import React from "react";
interface FileInputProps {
  value?: File;
  onChange: (newFile?: File) => void;
}
const FileInput: React.FC<FileInputProps> = ({ value, onChange }) => {
  return value ? (
    <>
      {value.name}
      <div>
        <Badge>{value.type}</Badge> <Badge>{value.size}</Badge>
      </div>
    </>
  ) : (
    <Input
      type="file"
      onChange={e => {
        onChange((e.currentTarget.files || [])[0]);
        e.currentTarget.value = "";
      }}
    />
  );
};
export default FileInput;
