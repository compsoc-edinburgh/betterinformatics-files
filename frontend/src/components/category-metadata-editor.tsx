import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  Col,
  FormGroup,
  Input,
  Label,
  ListGroup,
  ListGroupItem,
  Row,
  Select,
  TextareaField,
} from "@vseth/components";
import React, { useState } from "react";
import { fetchpost } from "../api/fetch-utils";
import useInitialState from "../hooks/useInitialState";
import { Attachment, CategoryMetaData } from "../interfaces";
import { createOptions, options, SelectOption } from "../ts-utils";
import FileInput from "./file-input";
import IconButton from "./icon-button";
import TwoButtons from "./two-buttons";

//'semester', 'form', 'permission', 'remark', 'has_payments', 'more_exams_link'
const setMetaData = async (
  slug: string,
  changes: Partial<CategoryMetaData>,
) => {
  if (Object.keys(changes).length === 0) return;
  await fetchpost(`/api/category/setmetadata/${slug}/`, changes);
};
const addUserToSet = async (slug: string, key: string, user: string) => {
  await fetchpost(`/api/category/addusertoset/${slug}/`, {
    key,
    user,
  });
};
const removeUserFromSet = async (slug: string, key: string, user: string) => {
  await fetchpost(`/api/category/removeuserfromset/${slug}/`, {
    key,
    user,
  });
};
const addMetaCategory = async (slug: string, meta1: string, meta2: string) => {
  await fetchpost("/api/category/addmetacategory/", {
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
  await fetchpost("/api/category/removemetacategory/", {
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
    await fetchpost("/api/filestore/upload/", {
      category,
      displayname,
      file,
    })
  ).filename as string;
};
const removeAttachment = async (filename: string) => {
  await fetchpost(`/api/filestore/remove/${filename}/`, {});
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

interface EditorAttachment {
  displayname: string;
  filename: File | string;
}
interface AttachmentsEditorProps {
  attachments: EditorAttachment[];
  setAttachments: (newAttachments: EditorAttachment[]) => void;
}
const toKey = (file: File | string) =>
  file instanceof File ? file.name : file;
const AttachmentsEditor: React.FC<AttachmentsEditorProps> = ({
  attachments,
  setAttachments,
}) => {
  const [file, setFile] = useState<File | undefined>();
  const [displayName, setDisplayName] = useState("");
  const onAdd = () => {
    if (file === undefined) return;
    setAttachments([
      ...attachments,
      { displayname: displayName, filename: file },
    ]);
    setFile(undefined);
    setDisplayName("");
  };
  const onRemove = (index: number) => {
    setAttachments(attachments.filter((_item, i) => i !== index));
  };
  return (
    <ListGroup>
      {attachments.map(({ displayname, filename }, index) => (
        <ListGroupItem key={toKey(filename)}>
          <Button close onClick={() => onRemove(index)} />
          {displayname} <Badge>{toKey(filename)}</Badge>
          {filename instanceof File && <Badge color="success">New</Badge>}
        </ListGroupItem>
      ))}
      <ListGroupItem>
        <Row>
          <Col md={5}>
            <FileInput value={file} onChange={setFile} />
          </Col>
          <Col md={5}>
            <Input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={e => setDisplayName(e.currentTarget.value)}
            />
          </Col>
          <Col md={2}>
            <Button block onClick={onAdd}>
              Add
            </Button>
          </Col>
        </Row>
      </ListGroupItem>
    </ListGroup>
  );
};

interface OfferedInEditorProps {
  offeredIn: Array<readonly [string, string]>;
  setOfferedIn: (newOfferedIn: Array<readonly [string, string]>) => void;
}
const OfferedInEditor: React.FC<OfferedInEditorProps> = ({
  offeredIn,
  setOfferedIn,
}) => {
  const [newMeta1, setNewMeta1] = useState("");
  const [newMeta2, setNewMeta2] = useState("");
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
    <ListGroup>
      {offeredIn.map(([meta1, meta2]) => (
        <ListGroupItem key={`${meta1}-${meta2}`}>
          <Button close onClick={() => onRemove(meta1, meta2)} />
          {meta1} {meta2}
        </ListGroupItem>
      ))}
      <ListGroupItem>
        <Row>
          <Col md={5}>
            <Input
              type="text"
              placeholder="Meta1"
              value={newMeta1}
              onChange={e => setNewMeta1(e.currentTarget.value)}
            />
          </Col>
          <Col md={5}>
            <Input
              type="text"
              placeholder="Meta2"
              value={newMeta2}
              onChange={e => setNewMeta2(e.currentTarget.value)}
            />
          </Col>
          <Col md={2}>
            <Button block onClick={onAdd}>
              Add
            </Button>
          </Col>
        </Row>
      </ListGroupItem>
    </ListGroup>
  );
};

interface UserSetEditorProps {
  users: string[];
  setUsers: (newUsers: string[]) => void;
}
const UserSetEditor: React.FC<UserSetEditorProps> = ({ users, setUsers }) => {
  const [username, setUsername] = useState("");
  const onAdd = () => {
    if (users.includes(username)) return;
    setUsername("");
    setUsers([...users, username]);
  };
  const remove = (username: string) => {
    setUsers(users.filter(un => un !== username));
  };
  return (
    <ListGroup>
      {users.map(user => (
        <ListGroupItem key={user}>
          <Button close onClick={() => remove(user)} />
          {user}
        </ListGroupItem>
      ))}
      <ListGroupItem>
        <Row>
          <Col md={10}>
            <Input
              type="text"
              placeholder="Name"
              value={username}
              onChange={e => setUsername(e.currentTarget.value)}
            />
          </Col>
          <Col md={2}>
            <Button block onClick={onAdd}>
              Add
            </Button>
          </Col>
        </Row>
      </ListGroupItem>
    </ListGroup>
  );
};

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
    <Card>
      <CardBody>
        <Button close onClick={toggle} />
        <h2>Edit Category</h2>
        {error && <Alert color="danger">{error.message}</Alert>}
        <h6>Meta Data</h6>
        <Row form>
          <Col md={6}>
            <FormGroup color="primary">
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
      </CardBody>
      <CardFooter>
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
      </CardFooter>
    </Card>
  );
};
export default CategoryMetaDataEditor;
