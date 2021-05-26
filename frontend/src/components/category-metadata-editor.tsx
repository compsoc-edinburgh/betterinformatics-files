import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Button,
  Col,
  FormGroup,
  InputField,
  Row,
  Select,
  TextareaField,
  Input,
  Label,
  CloseIcon,
  SaveIcon,
} from "@vseth/components";
import React from "react";
import { fetchPost } from "../api/fetch-utils";
import useForm from "../hooks/useForm";
import useInitialState from "../hooks/useInitialState";
import { Attachment, CategoryMetaData } from "../interfaces";
import { createOptions, options, SelectOption } from "../utils/ts-utils";
import AttachmentsEditor, { EditorAttachment } from "./attachments-editor";
import ButtonWrapperCard from "./button-wrapper-card";
import IconButton from "./icon-button";
import OfferedInEditor from "./offered-in-editor";
import UserSetEditor from "./user-set-editor";

//'semester', 'form', 'permission', 'remark', 'has_payments', 'more_exams_link'
const setMetaData = async (
  slug: string,
  changes: Partial<CategoryMetaData>,
) => {
  if (Object.keys(changes).length === 0) return;
  await fetchPost(`/api/category/setmetadata/${slug}/`, changes);
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
  await setMetaData(slug, metaDataDiff);
  const newAttachments: Attachment[] = [];
  for (const attachment of newMetaData.attachments) {
    if (attachment.filename instanceof File) {
      const filename = await addAttachment(
        slug,
        attachment.displayname,
        attachment.filename,
      );
      newAttachments.push({ displayname: attachment.displayname, filename });
    }
  }
  for (const attachment of oldMetaData.attachments) {
    if (
      newMetaData.attachments.find(
        (otherAttachment) => otherAttachment.filename === attachment.filename,
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
      await addMetaCategory(slug, newMeta1, newMeta2);
    }
  }
  for (const [oldMeta1, oldMeta2] of oldOfferedIn) {
    if (
      newOfferedIn.find(
        ([meta1, meta2]) => meta1 === oldMeta1 && meta2 === oldMeta2,
      ) === undefined
    ) {
      await removeMetaCategory(slug, oldMeta1, oldMeta2);
    }
  }
  for (const admin of newMetaData.admins) {
    if (oldMetaData.admins.indexOf(admin) === -1) {
      await addUserToSet(slug, "admins", admin);
    }
  }
  for (const admin of oldMetaData.admins) {
    if (newMetaData.admins.indexOf(admin) === -1) {
      await removeUserFromSet(slug, "admins", admin);
    }
  }

  for (const expert of newMetaData.experts) {
    if (oldMetaData.experts.indexOf(expert) === -1) {
      await addUserToSet(slug, "experts", expert);
    }
  }
  for (const expert of oldMetaData.experts) {
    if (newMetaData.experts.indexOf(expert) === -1) {
      await removeUserFromSet(slug, "experts", expert);
    }
  }
  return {
    ...oldMetaData,
    ...metaDataDiff,
    attachments: newAttachments,
    admins: newMetaData.admins,
    experts: newMetaData.experts,
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
    onSuccess: (newMetaData) => {
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
  } = useForm(currentMetaData as CategoryMetaDataDraft, (data) => {
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
      <Button close onClick={toggle} />
      <h2>Edit Category</h2>
      {error && <Alert color="danger">{error.toString()}</Alert>}
      <h6 className="mb-3 mt-4">Metadata</h6>
      <Row form>
        <Col md={6}>
          <FormGroup>
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
          </FormGroup>
        </Col>
        <Col md={6}>
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
        </Col>
      </Row>
      <TextareaField label="Remark" textareaProps={registerInput("remark")} />
      <Row form>
        <Col md={6}>
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
        </Col>
        <Col md={6}>
          <InputField
            type="url"
            label="More Exams Link"
            {...registerInput("more_exams_link")}
          />
        </Col>
      </Row>
      <FormGroup check>
        <Input
          type="checkbox"
          name="check"
          id="Has Payments"
          {...registerCheckbox("has_payments")}
        />
        <Label for="Has Payments" check>
          Has Payments
        </Label>
      </FormGroup>
      <h6 className="mb-3 mt-4">Attachments</h6>
      <AttachmentsEditor
        attachments={formState.attachments}
        setAttachments={(a) => setFormValue("attachments", a)}
      />
      <h6 className="mb-3 mt-4">Offered In</h6>
      <OfferedInEditor offeredIn={offeredIn} setOfferedIn={setOfferedIn} />
      <h6 className="mb-3 mt-4">Admins</h6>
      <UserSetEditor
        users={formState.admins}
        setUsers={(u) => setFormValue("admins", u)}
      />
      <h6 className="mb-3 mt-4">Experts</h6>
      <UserSetEditor
        users={formState.experts}
        setUsers={(e) => setFormValue("experts", e)}
      />
      <ButtonWrapperCard>
        <Row className="flex-between">
          <Col xs="auto">
            <IconButton
              icon={CloseIcon}
              onClick={() => {
                reset();
                toggle();
              }}
            >
              Cancel
            </IconButton>
          </Col>
          <Col xs="auto">
            <IconButton
              icon={SaveIcon}
              color="primary"
              loading={loading}
              onClick={onSubmit}
            >
              Save
            </IconButton>
          </Col>
        </Row>
      </ButtonWrapperCard>
    </>
  );
};
export default CategoryMetaDataEditor;
