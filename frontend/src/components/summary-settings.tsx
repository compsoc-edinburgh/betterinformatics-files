import { useRequest } from "@umijs/hooks";
import {
  Button,
  DeleteIcon,
  FormGroup,
  InputField,
  SaveIcon,
  Select,
  Spinner,
} from "@vseth/components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  loadCategories,
  Mutate,
  useDeleteSummary,
  useUpdateSummary,
} from "../api/hooks";
import { Summary } from "../interfaces";
import { createOptions, options } from "../utils/ts-utils";
import FileInput from "./file-input";

interface Props {
  data: Summary;
  mutate: Mutate<Summary>;
  slug: string;
}

const SummarySettings: React.FC<Props> = ({ slug, data, mutate }) => {
  const history = useHistory();
  const { loading: categoriesLoading, data: categories } = useRequest(
    loadCategories,
  );
  const categoryOptions =
    categories &&
    createOptions(
      Object.fromEntries(
        categories.map(
          category => [category.slug, category.displayname] as const,
        ),
      ) as { [key: string]: string },
    );

  const [loading, updateSummary] = useUpdateSummary(
    data.author,
    slug,
    result => {
      mutate(s => ({ ...s, ...result }));
      setDisplayName(undefined);
      setFile(undefined);
      setCategory(undefined);
      if (result.slug !== data.slug) {
        history.replace(`/user/${result.author}/summary/${result.slug}`);
      }
    },
  );
  const [, deleteSummary] = useDeleteSummary(
    data.author,
    slug,
    () => data && history.push(`/category/${data.category}`),
  );

  const [displayName, setDisplayName] = useState<string | undefined>();
  const [file, setFile] = useState<File | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  return (
    <>
      <InputField
        label="Display Name"
        value={displayName ?? data.display_name}
        onChange={e => setDisplayName(e.currentTarget.value)}
      />
      <FormGroup>
        <label className="form-input-label">Replace file</label>
        <FileInput value={file} onChange={setFile} />
      </FormGroup>
      <FormGroup>
        <label className="form-input-label">Category</label>
        <Select
          options={categoryOptions ? (options(categoryOptions) as any) : []}
          value={
            categoryOptions &&
            (category
              ? categoryOptions[category]
              : categoryOptions[data.category])
          }
          onChange={(e: any) => {
            setCategory(e.value as string);
          }}
          isLoading={categoriesLoading}
          required
        />
      </FormGroup>
      <div className="form-group d-flex justify-content-end">
        <Button
          onClick={() =>
            updateSummary({ display_name: displayName, file, category })
          }
        >
          Save
          {loading ? (
            <Spinner className="ml-2" size="sm" />
          ) : (
            <SaveIcon className="ml-2" />
          )}
        </Button>
      </div>

      <h3 className="mt-5 mb-4">Danger Zone</h3>
      <div className="d-flex flex-wrap justify-content-between align-items-center">
        <div className="d-flex flex-column">
          <h6>Delete this summary</h6>
          <div>
            Deleting the summary will delete the associated file and all
            comments. <b>This cannot be undone.</b>
          </div>
        </div>

        <Button color="danger" onClick={deleteSummary}>
          Delete <DeleteIcon className="ml-2" />
        </Button>
      </div>
    </>
  );
};

export default SummarySettings;
