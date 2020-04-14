import { Badge, Button } from "@vseth/components";
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
const FileInput: React.FC<FileInputProps> = ({ value, onChange, ...props }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="position-relative">
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
            className="position-absolute position-left"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            Choose File
          </Button>
          <input
            accept={props.accept}
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
