import {
  Button,
  Group,
  Modal,
  MultiSelect,
  Stack,
  Switch,
  TextInput,
  Text,
  Tree,
  Anchor,
  Divider,
  TreeNodeData,
  RenderTreeNodePayload,
} from "@mantine/core";
import React, { useMemo, useState } from "react";
import { useCreatePage, useListPages } from "../api/hooks/pages";
import { NavLink, useMatch, useNavigate } from "react-router-dom";
import {
  IconChevronRight,
  IconPlus,
  IconSquarePlus,
} from "@tabler/icons-react";
import style from "./guide-sidebar-left.module.css";
import { clsx } from "clsx";
import { Turnstile } from "@marsidev/react-turnstile";
import { useUser } from "../auth";
import { Kind } from "../api/model";
import serverData from "../utils/server-data";

const LeafNode: React.FC<RenderTreeNodePayload> = ({
  node,
  expanded,
  hasChildren,
  elementProps,
  tree,
}) => {
  const match = useMatch(`/guide/${node.value}`);

  return (
    <Anchor
      display="block"
      component={NavLink}
      to={`/guide/${node.value}`}
      {...elementProps}
      /* Override onCLick from default Tree prop list to only close expansion
         if we are already on the page -- otherwise it is annoying */
      onClick={_ => {
        if (hasChildren && (match || !expanded)) {
          tree.toggleExpanded(node.value);
        }
      }}
      className={clsx(
        style.treeNodeLink,
        match && style.active,
        elementProps.className,
      )}
    >
      <Group gap="xs" justify="space-between">
        <span className={style.ellipsis}>{node.label}</span>
        {hasChildren && (
          <IconChevronRight
            size={16}
            style={{
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        )}
      </Group>
    </Anchor>
  );
};

export const GuideSideBarLeft: React.FC = () => {
  const user = useUser();
  const navigate = useNavigate();

  const { data: pages, refetch: refetchPages } = useListPages({
    category: "",
  });

  const treeData = useMemo(() => {
    // Build a tree structure from the flat list of pages and parents
    if (!pages) return [];
    const pageMap: Record<string, { parents: string[] } & TreeNodeData> = {};
    pages.pages.forEach(page => {
      pageMap[page.slug] = {
        value: page.slug,
        label: page.title,
        children: undefined,
        parents: page.parents,
      };
    });
    pages.pages.forEach(page => {
      if (page.parents.length > 0) {
        for (const parentSlug of page.parents) {
          pageMap[parentSlug].children ??= [];
          pageMap[parentSlug].children.push(pageMap[page.slug]);
        }
      }
    });
    return Object.values(pageMap)
      .filter(node => !node.parents.length)
      .map(node => {
        const { parents, ...rest } = node;
        return rest;
      });
  }, [pages]);

  const [isOpen, setIsOpen] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [newPageParents, setNewPageParents] = useState<string[]>([]);
  const [newPageKind, setNewPageKind] = useState<Kind>("guide");
  const [newPageAnonymous, setNewPageAnonymous] = useState(false);

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

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
    request: {
      method: "POST",
      headers: {
        "X-Turnstile-Token": turnstileToken ?? "",
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
            {user?.isAdmin && (
              <Switch
                label="Create Static HTML Page"
                checked={newPageKind === "static_html"}
                onChange={() =>
                  setNewPageKind(
                    newPageKind === "static_html" ? "guide" : "static_html",
                  )
                }
              />
            )}
            <Turnstile
              siteKey={serverData.turnstile_sitekey}
              onSuccess={setTurnstileToken}
              options={{
                action: "create_page",
              }}
            />
            <Button
              disabled={createIsPending || newPageName.trim() === ""}
              onClick={() =>
                createPage({
                  data: {
                    kind: newPageKind,
                    title: newPageName,
                    parents: newPageParents,
                    category: null,
                    is_anonymous: newPageAnonymous,
                  },
                })
              }
              leftSection={<IconPlus />}
              loading={createIsPending || !turnstileToken}
            >
              Add
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Stack
        gap="xs"
        pos={{ base: "relative", sm: "sticky" }}
        miw="200px"
        top={{ base: 0, sm: "4rem" }}
        w={{ base: "100%", sm: "auto" }}
      >
        <Tree
          data={treeData}
          renderNode={payload => <LeafNode {...payload} />}
          classNames={{
            root: style.treeRoot,
            label: style.treeNodeLabel,
            subtree: style.treeSubtree,
          }}
        />
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
