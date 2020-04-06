import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  Col,
  FormGroup,
  Input,
  Label,
  Row,
  Select,
  TextareaField,
} from "@vseth/components";
import React from "react";
import { fetchPost } from "../api/fetch-utils";
import useInitialState from "../hooks/useInitialState";
import { Attachment, CategoryMetaData } from "../interfaces";
import { createOptions, options, SelectOption } from "../utils/ts-utils";
import AttachmentsEditor, { EditorAttachment } from "./attachments-editor";
import IconButton from "./icon-button";
import OfferedInEditor from "./offered-in-editor";
import TwoButtons from "./two-buttons";
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
  HS: "HS",
  FS: "FS",
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
  const { error, loading, run: runApplyChanges } = useRequest(applyChanges, {
    manual: true,
    onSuccess: newMetaData => {
      toggle();
      onMetaDataChange(newMetaData);
    },
  });

  const [semester, setSemester] = useInitialState<keyof typeof semesterOptions>(
    currentMetaData.semester as keyof typeof semesterOptions,
  );
  const [form, setForm] = useInitialState<keyof typeof formOptions>(
    currentMetaData.form as keyof typeof formOptions,
  );
  const [permission, setPermission] = useInitialState<
    keyof typeof permissionOptions
  >(currentMetaData.permission as keyof typeof permissionOptions);
  const [remark, setRemark] = useInitialState(currentMetaData.remark);
  const [moreExams, setMoreExams] = useInitialState(
    currentMetaData.more_exams_link,
  );
  const [hasPayments, setHasPayments] = useInitialState(
    currentMetaData.has_payments,
  );
  const [attachments, setAttachments] = useInitialState<EditorAttachment[]>(
    currentMetaData.attachments,
  );
  const [offeredIn, setOfferedIn] = useInitialState<
    Array<readonly [string, string]>
  >(propOfferedIn);
  const [admins, setAdmins] = useInitialState(currentMetaData.admins);
  const [experts, setExperts] = useInitialState(currentMetaData.experts);
  const save = () => {
    runApplyChanges(
      currentMetaData.slug,
      currentMetaData,
      {
        ...currentMetaData,
        semester,
        form,
        permission,
        remark,
        more_exams_link: moreExams,
        has_payments: hasPayments,
        attachments,
        admins,
        experts,
      },
      propOfferedIn,
      offeredIn,
    );
  };
  return (
    <>
      <Button close onClick={toggle} />
      <h2>Edit Category</h2>
      {error && <Alert color="danger">{error.message}</Alert>}
      <h6>Meta Data</h6>
      <Row form>
        <Col md={6}>
          <FormGroup>
            <label className="form-input-label">Semester</label>
            <Select
              options={options(semesterOptions)}
              value={semesterOptions[semester]}
              onChange={option =>
                setSemester(
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
              value={formOptions[form]}
              onChange={option =>
                setForm((option as SelectOption<typeof formOptions>).value)
              }
            />
          </FormGroup>
        </Col>
      </Row>
      <Row form>
        <Col md={12}>
          <FormGroup>
            <label className="form-input-label">Remark</label>
            <TextareaField
              textareaProps={{
                onChange: e => setRemark(e.currentTarget.value),
              }}
            >
              {remark}
            </TextareaField>
          </FormGroup>
        </Col>
      </Row>
      <Row form>
        <Col md={6}>
          <FormGroup>
            <label className="form-input-label">Permission</label>
            <Select
              options={options(permissionOptions)}
              value={permissionOptions[permission]}
              onChange={option =>
                setPermission(
                  (option as SelectOption<typeof permissionOptions>).value,
                )
              }
            />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <label className="form-input-label">More exams link</label>
            <Input
              type="url"
              value={moreExams}
              onChange={e => setMoreExams(e.currentTarget.value)}
            />
          </FormGroup>
        </Col>
      </Row>
      <Row form>
        <Col md={12}>
          <FormGroup check>
            <Input
              type="checkbox"
              name="check"
              id="hasPayments"
              checked={hasPayments}
              onChange={e => setHasPayments(e.currentTarget.checked)}
            />
            <Label for="hasPayments" check>
              Has Payments
            </Label>
          </FormGroup>
        </Col>
      </Row>
      <h6>Attachments</h6>
      <AttachmentsEditor
        attachments={attachments}
        setAttachments={setAttachments}
      />
      <h6>Offered In</h6>
      <OfferedInEditor offeredIn={offeredIn} setOfferedIn={setOfferedIn} />
      <h6>Admins</h6>
      <UserSetEditor users={admins} setUsers={setAdmins} />
      <h6>Experts</h6>
      <UserSetEditor users={experts} setUsers={setExperts} />
      <Card style={{ marginTop: "1em" }}>
        <CardHeader>
          <TwoButtons
            left={
              <IconButton
                icon="SAVE"
                color="primary"
                loading={loading}
                onClick={save}
              >
                Save
              </IconButton>
            }
            right={
              <IconButton icon="CLOSE" onClick={toggle}>
                Cancel
              </IconButton>
            }
          />
        </CardHeader>
      </Card>
    </>
  );
};
export default CategoryMetaDataEditor;
