import {
  Button,
  Group,
  Modal,
  MultiSelect,
  Stack,
  Switch,
  TextInput,
  Text,
  Anchor,
  Divider,
} from "@mantine/core";
import React, { useState } from "react";
import { useCreatePage, useListPages } from "../api/hooks/pages";
import { Link, useNavigate } from "react-router-dom";
import { IconPlus, IconSquarePlus } from "@tabler/icons-react";

export const GuideSideBarLeft: React.FC = () => {
  const navigate = useNavigate();

  const { data: pages, refetch: refetchPages } = useListPages({
    child_of: "",
    category: "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [newPageParents, setNewPageParents] = useState<string[]>([]);
  const [newPageAnonymous, setNewPageAnonymous] = useState(false);
  const {
    mutate: createPage,
    isPending: createIsPending,
    isError: createIsError,
  } = useCreatePage({
    mutation: {
      onSuccess(data) {
        setIsOpen(false);
        setNewPageName("");
        setNewPageParents([]);
        setNewPageAnonymous(false);
        void refetchPages();
        void navigate(`/guide/${data.slug}`);
      },
    },
  });
  return (
    <>
      <Modal
        opened={isOpen}
        title="Create New Page"
        onClose={() => setIsOpen(false)}
      >
        <Stack>
          {createIsError && <Text c="red">Page could not be created.</Text>}
          <TextInput
            label="Page Name"
            placeholder="Guide to Edinburgh"
            value={newPageName}
            onChange={e => setNewPageName(e.currentTarget.value)}
          />
          <MultiSelect
            label="Parents"
            placeholder="Select (optional) parent pages"
            data={pages?.pages.map(p => ({ value: p.slug, label: p.title }))}
            value={newPageParents}
            onChange={setNewPageParents}
            searchable
          />
          <Group justify="space-between">
            <Switch
              label="Create Anonymously"
              checked={newPageAnonymous}
              onChange={() => setNewPageAnonymous(!newPageAnonymous)}
            />
            <Button
              disabled={createIsPending || newPageName.trim() === ""}
              onClick={() =>
                createPage({
                  data: {
                    title: newPageName,
                    parents: newPageParents,
                    category: null,
                    is_anonymous: newPageAnonymous,
                  },
                })
              }
              leftSection={<IconPlus />}
              loading={createIsPending}
            >
              Add
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Stack gap="xs" style={{ minWidth: "200px" }}>
        {pages?.pages.map(p => (
          <Anchor
            display="block"
            key={p.slug}
            to={`/guide/${p.slug}`}
            component={Link}
          >
            {p.title}
          </Anchor>
        ))}
        <Divider my="md" />
        <Button
          onClick={() => setIsOpen(true)}
          size="compact-sm"
          variant="subtle"
          leftSection={<IconSquarePlus size={16} />}
          justify="flex-start"
        >
          Create New Page
        </Button>
      </Stack>
    </>
  );
};
