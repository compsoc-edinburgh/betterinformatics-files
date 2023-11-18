import { Alert, Button, Grid, Group, Select } from "@mantine/core";
import React, { useMemo, useState } from "react";
import { Icon, ICONS } from "vseth-canine-ui";
import { useMetaCategories } from "../api/hooks";

interface OfferedInEditorProps {
  offeredIn: Array<readonly [string, string]>;
  setOfferedIn: (newOfferedIn: Array<readonly [string, string]>) => void;
}
const OfferedInEditor: React.FC<OfferedInEditorProps> = ({
  offeredIn,
  setOfferedIn,
}) => {
  const [newMeta1, setNewMeta1] = useState("");
  const meta1Value = useMemo(() => newMeta1, [newMeta1]);
  const [newMeta2, setNewMeta2] = useState("");
  const meta2Value = useMemo(() => newMeta2, [newMeta2]);
  const [error, loading, data, mutate] = useMetaCategories();
  const meta1Options: string[] = useMemo(
    () => (data && data.map(d => d.displayname)) ?? [],
    [data],
  );
  const meta2Options: string[] = useMemo(
    () =>
      data && newMeta1.length > 0
        ? data
            .find(m => m.displayname === newMeta1)
            ?.meta2.map(m => m.displayname) ?? []
        : [],
    [data, newMeta1],
  );
  const onMeta1Change = (value: string) => {
    setNewMeta1(value);
    setNewMeta2("");
    if (data && !data.some(d => d.displayname === value)) {
      mutate([{ displayname: value, meta2: [] }]);
    }
  };
  const onMeta2Change = (value: string) => {
    setNewMeta2(value);
    if (data && !data.some(d => d.displayname === value)) {
      mutate([
        {
          displayname: newMeta1,
          meta2: data
            .find(d => d.displayname === newMeta1)!
            .meta2.concat({ displayname: value, categories: [] }),
        },
      ]);
    }
  };
  const onAdd = () => {
    setNewMeta1("");
    setNewMeta2("");
    setOfferedIn([...offeredIn, [newMeta1, newMeta2]]);
  };
  const onRemove = (meta1: string, meta2: string) => {
    setOfferedIn(
      offeredIn.filter(
        ([meta1s, meta2s]) => meta1s !== meta1 || meta2s !== meta2,
      ),
    );
  };
  return (
    <>
      {error && <Alert color="red">{error.toString()}</Alert>}
      <Group>
        {offeredIn.map(([meta1, meta2]) => (
          <Button
            key={`${meta1}-${meta2}`}
            leftIcon={<Icon icon={ICONS.CLOSE} />}
            variant="default"
            loading={loading}
            onClick={() => onRemove(meta1, meta2)}
          >
            {meta1} {meta2}
          </Button>
        ))}
      </Group>
      <form
        onSubmit={e => {
          e.preventDefault();
          onAdd();
        }}
      >
        <Grid my="xs" align="end">
          <Grid.Col md={5}>
            {data && (
              <Select
                label="Meta 1"
                creatable
                searchable
                getCreateLabel={query => `+ Create new Meta 1 "${query}"`}
                data={meta1Options}
                value={meta1Value}
                onChange={onMeta1Change}
              />
            )}
          </Grid.Col>
          <Grid.Col md={5}>
            {data && (
              <Select
                label="Meta 2"
                creatable
                searchable
                getCreateLabel={query => `+ Create new Meta 2 "${query}"`}
                data={meta2Options}
                value={meta2Value}
                onChange={onMeta2Change}
              />
            )}
          </Grid.Col>
          <Grid.Col md={2}>
            <Button fullWidth type="submit">
              Add
            </Button>
          </Grid.Col>
        </Grid>
      </form>
    </>
  );
};
export default OfferedInEditor;
