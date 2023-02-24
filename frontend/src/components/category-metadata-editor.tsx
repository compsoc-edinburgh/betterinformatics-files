import { useRequest } from "@umijs/hooks";
import {
  Col,
  FormGroup,
  InputField,
  Row,
  Select,
} from "@vseth/components";
import {
  Alert,
  Button,
  Checkbox,
  CloseButton,
  Grid,
  Textarea,
  TextInput,
} from "@mantine/core"
import React from "react";
import { Icon, ICONS } from "vseth-canine-ui";
import { fetchPost } from "../api/fetch-utils";
import useForm from "../hooks/useForm";
import useInitialState from "../hooks/useInitialState";
import { Attachment, CategoryMetaData } from "../interfaces";
import { createOptions, options, SelectOption } from "../utils/ts-utils";
import AttachmentsEditor, { EditorAttachment } from "./attachments-editor";
import ButtonWrapperCard from "./button-wrapper-card";
import OfferedInEditor from "./offered-in-editor";
import UserSetEditor from "./user-set-editor";

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
      <CloseButton onClick={toggle} />
      <h2>Edit Category</h2>
      {error && <Alert color="danger">{error.toString()}</Alert>}
      <h6 className="mb-3 mt-4">Metadata</h6>
      <TextInput label="Name" {...registerInput("displayname")} />
      <Grid>
        <Grid.Col md={6}>
          <label className="form-input-label">Semester</label>
          <Select
            options={options(semesterOptions)}
            value={
              semesterOptions[
              formState.semester as keyof typeof semesterOptions
              ]
            }
            onChange={(option: any) =>
              setFormValue(
                "semester",
                (option as SelectOption<typeof semesterOptions>).value,
              )
            }
          />
        </Grid.Col>
        <Grid.Col md={6}>
          <FormGroup>
            <label className="form-input-label">Form</label>
            <Select
              options={options(formOptions)}
              value={formOptions[formState.form as keyof typeof formOptions]}
              onChange={(option: any) =>
                setFormValue(
                  "form",
                  (option as SelectOption<typeof formOptions>).value,
                )
              }
            />
          </FormGroup>
        </Grid.Col>
      </Grid>
      <Textarea label="Remark" />
      <Grid>
        <Grid.Col md={6}>
          <FormGroup>
            <label className="form-input-label">Permission</label>
            <Select
              options={options(permissionOptions)}
              value={
                permissionOptions[
                formState.permission as keyof typeof permissionOptions
                ]
              }
              onChange={(option: any) =>
                setFormValue(
                  "permission",
                  (option as SelectOption<typeof permissionOptions>).value,
                )
              }
            />
          </FormGroup>
        </Grid.Col>
        <Grid.Col md={6}>
          <InputField
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
      <h6 className="mb-3 mt-4">Attachments</h6>
      <AttachmentsEditor
        attachments={formState.attachments}
        setAttachments={a => setFormValue("attachments", a)}
      />
      <h6 className="mb-3 mt-4">Offered In</h6>
      <OfferedInEditor offeredIn={offeredIn} setOfferedIn={setOfferedIn} />
      <h6 className="mb-3 mt-4">Admins</h6>
      <UserSetEditor
        users={formState.admins}
        setUsers={u => setFormValue("admins", u)}
      />
      <h6 className="mb-3 mt-4">Experts</h6>
      <UserSetEditor
        users={formState.experts}
        setUsers={e => setFormValue("experts", e)}
      />
      <ButtonWrapperCard>
        <Row className="flex-between">
          <Col xs="auto">
            <Button
              leftIcon={<Icon icon={ICONS.CLOSE} />}
              variant="light"
              onClick={() => {
                reset();
                toggle();
              }}
            >
              Cancel
            </Button>
          </Col>
          <Col xs="auto">
            <Button
              leftIcon={<Icon icon={ICONS.SAVE} />}
              color="primary"
              variant="light"
              loading={loading}
              onClick={onSubmit}
            >
              Save
            </Button>
          </Col>
        </Row>
      </ButtonWrapperCard>
    </>
  );
};
export default CategoryMetaDataEditor;
