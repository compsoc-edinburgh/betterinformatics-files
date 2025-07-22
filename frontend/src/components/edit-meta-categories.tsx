import { useDisclosure } from "@mantine/hooks";
import { fetchPost } from "../api/fetch-utils";
import useInitialState from "../hooks/useInitialState";
import { useRequest } from "@umijs/hooks";
import { useMetaCategories } from "../api/hooks";
import { useEffect, useMemo } from "react";
import { Button, Flex, Loader, Modal, Stack, TextInput } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import Creatable from "./creatable";

const editMeta1Name = async (oldmeta1: string, newmeta1: string) => {
  await fetchPost("/api/category/editmeta1/", { oldmeta1, newmeta1});
};

const editMeta2Name = async (oldmeta2: string, newmeta2: string, meta1: string, newmeta1: string) => {
  await fetchPost("/api/category/editmeta2/", { oldmeta2, newmeta2, meta1, newmeta1 });
};

const deleteMeta1 = async (meta1: string) => {
  await fetchPost("/api/category/deletemeta1/", { meta1 });
};

const deleteMeta2 = async (meta1: string, meta2: string) => {
  await fetchPost("/api/category/deletemeta2/", { meta1, meta2 });
};

interface EditMeta1Props {
  oldMeta1: string;
  onChange: () => void;
}
export const EditMeta1: React.FC<EditMeta1Props> = ({oldMeta1, onChange}) => {
    const [editModal, {open: openEditModal, close: closeEditModal}] = useDisclosure();
    const [deleteModal, {open: openDeleteModal, close: closeDeleteModal}] = useDisclosure();
    const [meta1, setMeta1] = useInitialState(oldMeta1);
    const [disabled, setDisabled] = useInitialState(true);
    const { loading, run } = useRequest(editMeta1Name, {
      manual: true,
      onSuccess: () => {
        closeEditModal();
        onChange();
      },
    });
    const { loading: deleteLoading, run: deleteRun } = useRequest(deleteMeta1, {
      manual: true,
      onSuccess: () => {
        onChange();
      }
    });
    const onSubmit = () => {
      run(oldMeta1, meta1);
    };
    const onDelete = () => {
      deleteRun(oldMeta1);
    };
    const [error, metaLoading, data, mutate] = useMetaCategories();
    const meta1Options: string[] = useMemo(
      () => (data && data.map(d => d.displayname)) ?? [],
      [data],
    );
    const onTextChange = (input: string) => {
      setMeta1(input);
      if (meta1Options.includes(input)) {
        setDisabled(true);
      } else {
        setDisabled(false);
      }
    }
  
    return (
      <>
        <Modal
          opened={deleteModal}
          onClose={closeDeleteModal}
          title="Delete Meta Category"
        >
          <Stack>
            Are you sure you want to delete this meta category?
            <b>This is irreversible.</b>
            Note:
            This action will also delete the sub meta categories but won't delete the categories themselves.
            <Flex gap={"lg"}>
              <Button
                flex={1}
                onClick={onDelete}
                color="red"
              >
                Delete
              </Button>
              <Button
                flex={1}
                onClick={closeDeleteModal}
              >
                Cancel
              </Button>
            </Flex>
          </Stack>
        </Modal>
        <Modal
          opened={editModal}
          onClose={closeEditModal}
          title="Edit Meta Category"
        >
          <Stack>
            <TextInput
              label="Meta Category Name"
              type="text"
              value={meta1}
              onChange={(e) => {onTextChange(e.currentTarget.value)}}
            />
            <Button
              onClick={onSubmit}
              disabled={meta1.length === 0 || loading || disabled}
            >
              {loading ? <Loader /> : "Edit Meta Category"}
            </Button>
          </Stack>
        </Modal>
        <Button
          leftSection={<IconEdit/>}
          onClick={openEditModal}
        >
          Edit
        </Button>
        <Button
          leftSection={<IconTrash/>}
          onClick={openDeleteModal}
        >
          Delete
        </Button>
      </>
    )
  }
  
  interface EditMeta2Props {
    oldMeta2: string;
    meta1: string;
    onChange: () => void;
  }
  
  export const EditMeta2: React.FC<EditMeta2Props> = ({oldMeta2, meta1, onChange}) => {
    const [editModal, {open: openEditModal, close: closeEditModal}] = useDisclosure();
    const [deleteModal, {open: openDeleteModal, close: closeDeleteModal}] = useDisclosure();
    const [disabled, setDisabled] = useInitialState(true);
    const { loading, run } = useRequest(editMeta2Name, {
      manual: true,
      onSuccess: () => {
        closeEditModal();
        onChange();
      },
    });
  
    const { loading: deleteLoading, run: deleteRun } = useRequest(deleteMeta2, {
      manual: true,
      onSuccess: () => {
        onChange();
      }
    });
  
    const [newMeta1, setNewMeta1] = useInitialState(meta1);
    const [newMeta2, setNewMeta2] = useInitialState(oldMeta2);
    const [error, loadingMeta, data, mutate] = useMetaCategories();
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
      checkIfExists();
    };
    const onMeta1Create = (value: string) => {
      setNewMeta1(value);
      checkIfExists();
      return value;
    };
    const onSubmit = () => {
      run(oldMeta2, newMeta2, meta1, newMeta1);
    };
    const onDelete = () => {
      deleteRun(meta1, oldMeta2);
    };
    const onTextChange = (input: string) => {
      setNewMeta2(input);
      checkIfExists();
    }
    const checkIfExists = () => {
      if (meta2Options.includes(newMeta2)) {
        setDisabled(true);
      } else {
        setDisabled(false);
      }
    }
  
    useEffect(checkIfExists, [meta2Options, newMeta2]);
  
    return (
      <>
        <Modal
          opened={deleteModal}
          onClose={closeDeleteModal}
          title="Delete Meta Category"
        >
          <Stack>
            Are you sure you want to delete this meta category?
            <b>This is irreversible.</b>
            Note:
            This action won't delete the categories themselves.
            <Flex gap={"lg"}>
              <Button
                flex={1}
                onClick={onDelete}
                color="red"
              >
                Delete
              </Button>
              <Button
                flex={1}
                onClick={closeDeleteModal}
              >
                Cancel
              </Button>
            </Flex>
          </Stack>
        </Modal>
        <Modal
          opened={editModal}
          onClose={closeEditModal}
          title="Edit Meta Category"
          size="md"
        >
          <Stack gap={"lg"}>
            <TextInput
              label="Meta Category Name"
              type="text"
              value={newMeta2}
              onChange={e => onTextChange(e.currentTarget.value)}
            />
            <Creatable
              title="Edit Parent"
              getCreateLabel={(query: string) =>
                `+ Create new Parent Meta Category "${query}"`
              }
              data={meta1Options}
              value={newMeta1}
              onChange={onMeta1Change}
              onCreate={onMeta1Create}  
              withinPortal={true}
            />
            <Button
              onClick={onSubmit}
              disabled={newMeta2.length === 0 || loading || disabled}
            >
              {loading ? <Loader /> : "Edit Meta Category"}
            </Button>
          </Stack>
        </Modal>
        <Button
          leftSection={<IconEdit/>}
          onClick={openEditModal}
        >
          Edit
        </Button>
        <Button
          leftSection={<IconTrash/>}
          onClick={openDeleteModal}
        >
          Delete
        </Button>
      </>
    )
  }