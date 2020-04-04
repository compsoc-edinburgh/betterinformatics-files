import { Badge, Button } from "@vseth/components";
import React, { useRef } from "react";
interface FileInputProps
  extends Omit<
    React.DetailedHTMLProps<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >,
    "value" | "onChange"
  > {
  value?: File;
  onChange: (newFile?: File) => void;
}
const FileInput: React.FC<FileInputProps> = ({ value, onChange, ...props }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div style={{ position: "relative" }}>
      {value ? (
        <div className="form-control">
          <Button close onClick={() => onChange(undefined)} />
          {value.name}
          <Badge>{value.type}</Badge> <Badge>{value.size}</Badge>
        </div>
      ) : (
        <div className="form-control">
          &nbsp;
          <Button
            style={{ position: "absolute", top: 0, left: 0 }}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            Choose File
          </Button>
          <input
            {...props}
            hidden
            type="file"
            onChange={e => {
              onChange((e.currentTarget.files || [])[0]);
              e.currentTarget.value = "";
            }}
            ref={fileInputRef}
          />
        </div>
      )}
    </div>
  );
};
export default FileInput;
