import { InputField, Button } from "@vseth/components";
import React from "react";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { useDeleteSummary, useUpdateSummary } from "../api/hooks";
import { Summary } from "../interfaces";
import FileInput from "./file-input";

interface Props {
  data: Summary;
  slug: string;
}

const SummarySettings: React.FC<Props> = ({ slug, data }) => {
  const history = useHistory();
  const [, updateSummary] = useUpdateSummary(slug, () => void 0);
  const [, deleteSummary] = useDeleteSummary(
    slug,
    () => data && history.push(`/category/${data.category}`),
  );
  const [file, setFile] = useState<File | undefined>();
  const [displayName, setDisplayName] = useState(data.display_name);
  return (
    <>
      <InputField
        label="Display Name"
        value={displayName}
        onChange={e => setDisplayName(e.currentTarget.value)}
      />
      <div className="form-group">
        <label className="form-input-label">Replace file</label>
        <FileInput value={file} onChange={setFile} />
      </div>
      <div className="form-group d-flex justify-content-end">
        <Button
          onClick={() => updateSummary({ display_name: displayName, file })}
        >
          Save
        </Button>
      </div>

      <h3 className="mt-5 mb-4">Danger Zone</h3>
      <div className="d-flex flex-wrap justify-content-between align-items-center">
        <div className="d-flex flex-column">
          <h6>Delete this summary</h6>
          <div>
            Deleting the summary will delete the associated file and all
            comments. This cannot be undone.
          </div>
        </div>

        <Button color="danger" onClick={deleteSummary}>
          Delete
        </Button>
      </div>
    </>
  );
};

export default SummarySettings;
