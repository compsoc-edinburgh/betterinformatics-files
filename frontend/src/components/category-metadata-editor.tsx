import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Button,
  Checkbox,
  CloseButton,
  Grid,
  Group,
  NativeSelect,
  Stack,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import React from "react";
import { fetchPost } from "../api/fetch-utils";
import useForm from "../hooks/useForm";
import useInitialState from "../hooks/useInitialState";
import { Attachment, CategoryMetaData } from "../interfaces";
import { createOptions, options } from "../utils/ts-utils";
import AttachmentsEditor, { EditorAttachment } from "./attachments-editor";
import OfferedInEditor from "./offered-in-editor";
import UserSetEditor from "./user-set-editor";
import { IconDeviceFloppy, IconX } from "@tabler/icons-react";

//'semester', 'form', 'permission', 'remark', 'has_payments', 'more_exams_link'
const setMetaData = async (
  slug: string,
  changes: Partial<CategoryMetaData>,
): Promise<CategoryMetaData | undefined> => {
  if (Object.keys(changes).length === 0) return;
  return (await fetchPost(`/api/category/setmetadata/${slug}/`, changes)).value;
};
const addUserToSet = async (slug: string, key: string, user: string) => {
  await fetchPost(`/api/category/addusertoset/${slug}/`, {
    key,
    user,
  });
};
const removeUserFromSet = async (slug: string, key: string, user: string) => {
  await fetchPost(`/api/category/removeuserfromset/${slug}/`, {
    key,
    user,
  });
};
const addMetaCategory = async (slug: string, meta1: string, meta2: string) => {
  await fetchPost("/api/category/addmetacategory/", {
    meta1,
    meta2,
    category: slug,
  });
};
const removeMetaCategory = async (
  slug: string,
  meta1: string,
  meta2: string,
) => {
  await fetchPost("/api/category/removemetacategory/", {
    meta1,
    meta2,
    category: slug,
  });
};
const addAttachment = async (
  category: string,
  displayname: string,
  file: File,
) => {
  return (
    await fetchPost("/api/filestore/upload/", {
      category,
      displayname,
      file,
    })
  ).filename as string;
};
const removeAttachment = async (filename: string) => {
  await fetchPost(`/api/filestore/remove/${filename}/`, {});
};

export interface CategoryMetaDataDraft
  extends Omit<CategoryMetaData, "attachments"> {
  attachments: EditorAttachment[];
}

const applyChanges = async (
  slug: string,
  oldMetaData: CategoryMetaData,
  newMetaData: CategoryMetaDataDraft,
  oldOfferedIn: Array<readonly [string, string]>,
  newOfferedIn: Array<readonly [string, string]>,
) => {
  const metaDataDiff: Partial<CategoryMetaData> = {};
  if (oldMetaData.displayname !== newMetaData.displayname)
    metaDataDiff.displayname = newMetaData.displayname;
  if (oldMetaData.semester !== newMetaData.semester)
    metaDataDiff.semester = newMetaData.semester;
  if (oldMetaData.form !== newMetaData.form)
    metaDataDiff.form = newMetaData.form;
  if (oldMetaData.remark !== newMetaData.remark)
    metaDataDiff.remark = newMetaData.remark;
  if (oldMetaData.has_payments !== newMetaData.has_payments)
    metaDataDiff.has_payments = newMetaData.has_payments;
  if (oldMetaData.more_exams_link !== newMetaData.more_exams_link)
    metaDataDiff.more_exams_link = newMetaData.more_exams_link;
  if (oldMetaData.permission !== newMetaData.permission)
    metaDataDiff.permission = newMetaData.permission;
  const fetchedMetaData = await setMetaData(slug, metaDataDiff);
  const newSlug = fetchedMetaData?.slug ?? slug;
  const newAttachments: Attachment[] = [];
  for (const attachment of newMetaData.attachments) {
    if (attachment.filename instanceof File) {
      const filename = await addAttachment(
        newSlug,
        attachment.displayname,
        attachment.filename,
      );
      newAttachments.push({ displayname: attachment.displayname, filename });
    }
  }
  for (const attachment of oldMetaData.attachments) {
    if (
      newMetaData.attachments.find(
        otherAttachment => otherAttachment.filename === attachment.filename,
      )
    ) {
      newAttachments.push(attachment);
    } else {
      await removeAttachment(attachment.filename);
    }
  }
  for (const [newMeta1, newMeta2] of newOfferedIn) {
    if (
      oldOfferedIn.find(
        ([meta1, meta2]) => meta1 === newMeta1 && meta2 === newMeta2,
      ) === undefined
    ) {
      await addMetaCategory(newSlug, newMeta1, newMeta2);
    }
  }
  for (const [oldMeta1, oldMeta2] of oldOfferedIn) {
    if (
      newOfferedIn.find(
        ([meta1, meta2]) => meta1 === oldMeta1 && meta2 === oldMeta2,
      ) === undefined
    ) {
      await removeMetaCategory(newSlug, oldMeta1, oldMeta2);
    }
  }
  for (const admin of newMetaData.admins) {
    if (oldMetaData.admins.indexOf(admin) === -1) {
      await addUserToSet(newSlug, "admins", admin);
    }
  }
  for (const admin of oldMetaData.admins) {
    if (newMetaData.admins.indexOf(admin) === -1) {
      await removeUserFromSet(newSlug, "admins", admin);
    }
  }

  for (const expert of newMetaData.experts) {
    if (oldMetaData.experts.indexOf(expert) === -1) {
      await addUserToSet(newSlug, "experts", expert);
    }
  }
  for (const expert of oldMetaData.experts) {
    if (newMetaData.experts.indexOf(expert) === -1) {
      await removeUserFromSet(newSlug, "experts", expert);
    }
  }
  return {
    ...oldMetaData,
    ...metaDataDiff,
    attachments: newAttachments,
    admins: newMetaData.admins,
    experts: newMetaData.experts,
    slug: newSlug,
  };
};

const semesterOptions = createOptions({
  None: "--",
  HS: "HS",
  FS: "FS",
  Both: "Both",
});
const formOptions = createOptions({
  oral: "Oral",
  written: "Written",
});
const permissionOptions = createOptions({
  public: "public",
  intern: "intern",
  hidden: "hidden",
  none: "none",
});

interface CategoryMetaDataEditorProps {
  currentMetaData: CategoryMetaData;
  onMetaDataChange: (newMetaData: CategoryMetaData) => void;
  isOpen: boolean;
  toggle: () => void;
  offeredIn: Array<readonly [string, string]>;
}
const CategoryMetaDataEditor: React.FC<CategoryMetaDataEditorProps> = ({
  onMetaDataChange,
  currentMetaData,
  isOpen,
  toggle,
  offeredIn: propOfferedIn,
}) => {
  const {
    error,
    loading,
    run: runApplyChanges,
  } = useRequest(applyChanges, {
    manual: true,
    onSuccess: newMetaData => {
      toggle();
      onMetaDataChange(newMetaData);
    },
  });
  const [offeredIn, setOfferedIn] =
    useInitialState<Array<readonly [string, string]>>(propOfferedIn);
  const {
    registerInput,
    registerCheckbox,
    reset,
    formState,
    setFormValue,
    onSubmit,
  } = useForm(currentMetaData as CategoryMetaDataDraft, data => {
    runApplyChanges(
      currentMetaData.slug,
      currentMetaData,
      data,
      propOfferedIn,
      offeredIn,
    );
  });
  return (
    <>
      <Group justify="space-between">
        <h2>Edit Category</h2>
        <CloseButton onClick={toggle} />
      </Group>
      {error && <Alert color="red">{error.toString()}</Alert>}
      <Title order={4} mb="xs">
        Metadata
      </Title>
      <Stack>
        <TextInput
          disabled={currentMetaData.slug === "default"}
          label="Name"
          {...registerInput("displayname")}
        />
        <Grid>
          <Grid.Col span={{ md: 6 }}>
            <NativeSelect
              label="Semester"
              data={options(semesterOptions)}
              value={
                semesterOptions[
                  formState.semester as keyof typeof semesterOptions
                ]?.value ?? "--"
              }
              onChange={(event: any) =>
                setFormValue("semester", event.currentTarget.value)
              }
            />
          </Grid.Col>
          <Grid.Col span={{ md: 6 }}>
            <NativeSelect
              label="Form"
              data={options(formOptions)}
              value={
                formOptions[formState.form as keyof typeof formOptions].value
              }
              onChange={(event: any) =>
                setFormValue("form", event.currentTarget.value)
              }
            />
          </Grid.Col>
        </Grid>
        <Textarea label="Remark" {...registerInput("remark")} />
        <Grid>
          <Grid.Col span={{ md: 6 }}>
            <NativeSelect
              label="Permission"
              data={options(permissionOptions)}
              value={
                permissionOptions[
                  formState.permission as keyof typeof permissionOptions
                ].value
              }
              onChange={(event: any) =>
                setFormValue("permission", event.currentTarget.value)
              }
            />
          </Grid.Col>
          <Grid.Col span={{ md: 6 }}>
            <TextInput
              type="url"
              label="More Exams Link"
              {...registerInput("more_exams_link")}
            />
          </Grid.Col>
        </Grid>
        <Checkbox
          name="check"
          label="Has Payments"
          {...registerCheckbox("has_payments")}
        />
      </Stack>
      <Title order={4} mt="xl" mb="sm">
        Attachments
      </Title>
      <AttachmentsEditor
        attachments={formState.attachments}
        setAttachments={a => setFormValue("attachments", a)}
      />
      <Title order={4} mt="xl" mb="sm">
        Offered In
      </Title>
      <OfferedInEditor offeredIn={offeredIn} setOfferedIn={setOfferedIn} />
      <Title order={4} mt="xl" mb="sm">
        Admins
      </Title>
      <UserSetEditor
        users={formState.admins}
        setUsers={u => setFormValue("admins", u)}
      />
      <Title order={4} mt="xl" mb="sm">
        Experts
      </Title>
      <UserSetEditor
        users={formState.experts}
        setUsers={e => setFormValue("experts", e)}
      />
      <Group mt="lg" justify="right">
        <Button
          leftSection={<IconX />}
          onClick={() => {
            reset();
            toggle();
          }}
        >
          Cancel
        </Button>
        <Button
          leftSection={<IconDeviceFloppy />}
          loading={loading}
          onClick={onSubmit}
        >
          Save
        </Button>
      </Group>
    </>
  );
};
export default CategoryMetaDataEditor;
