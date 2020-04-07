import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Button,
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
import { loadCategories } from "../api/hooks";
import useInitialState from "../hooks/useInitialState";
import { Attachment, ExamMetaData } from "../interfaces";
import { createOptions, options, SelectOption } from "../utils/ts-utils";
import AttachmentsEditor, { EditorAttachment } from "./attachments-editor";
import ButtonWrapperCard from "./button-wrapper-card";
import FileInput from "./file-input";
import IconButton from "./icon-button";
import TwoButtons from "./two-buttons";
const stringKeys = [
  "displayname",
  "category",
  "examtype",
  "legacy_solution",
  "master_solution",
  "resolve_alias",
  "remark",
] as const;
const booleanKeys = [
  "public",
  "finished_cuts",
  "finished_wiki_transfer",
  "needs_payment",
  "solution_printonly",
] as const;

const setMetaData = async (
  filename: string,
  changes: Partial<ExamMetaData>,
) => {
  if (Object.keys(changes).length === 0) return;
  await fetchPost(`/api/exam/setmetadata/${filename}/`, changes);
};
const addAttachment = async (exam: string, displayname: string, file: File) => {
  return (
    await fetchPost("/api/filestore/upload/", {
      exam,
      displayname,
      file,
    })
  ).filename as string;
};
const removeAttachment = async (filename: string) => {
  await fetchPost(`/api/filestore/remove/${filename}/`, {});
};
const setPrintOnly = async (filename: string, file: File) => {
  await fetchPost(`/api/exam/upload/printonly/`, { file, filename });
};
const removePrintOnly = async (filename: string) => {
  await fetchPost(`/api/exam/remove/printonly/${filename}/`, {});
};
const setSolution = async (filename: string, file: File) => {
  await fetchPost(`/api/exam/upload/solution/`, { file, filename });
};
const removeSolution = async (filename: string) => {
  await fetchPost(`/api/exam/remove/solution/${filename}/`, {});
};

const examTypeOptions = createOptions({
  Exams: "Exams",
  "Old Exams": "Old Exams",
});
export interface ExamMetaDataDraft extends Omit<ExamMetaData, "attachments"> {
  attachments: EditorAttachment[];
}
const applyChanges = async (
  filename: string,
  oldMetaData: ExamMetaData,
  newMetaData: ExamMetaDataDraft,
  printonly: File | true | undefined,
  masterSolution: File | true | undefined,
) => {
  const metaDataDiff: Partial<ExamMetaData> = {};
  for (const key of stringKeys)
    if (oldMetaData[key] !== newMetaData[key])
      metaDataDiff[key] = newMetaData[key];
  for (const key of booleanKeys)
    if (oldMetaData[key] !== newMetaData[key])
      metaDataDiff[key] = newMetaData[key];
  await setMetaData(filename, metaDataDiff);
  const newAttachments: Attachment[] = [];
  for (const attachment of newMetaData.attachments) {
    if (attachment.filename instanceof File) {
      const newFilename = await addAttachment(
        filename,
        attachment.displayname,
        attachment.filename,
      );
      newAttachments.push({
        displayname: attachment.displayname,
        filename: newFilename,
      });
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
  if (printonly === undefined && oldMetaData.is_printonly) {
    await removePrintOnly(filename);
    metaDataDiff.is_printonly = false;
  } else if (printonly instanceof File) {
    await setPrintOnly(filename, printonly);
    metaDataDiff.is_printonly = true;
  }
  if (masterSolution === undefined && oldMetaData.has_solution) {
    await removeSolution(filename);
    metaDataDiff.has_solution = false;
  } else if (masterSolution instanceof File) {
    await setSolution(filename, masterSolution);
    metaDataDiff.has_solution = true;
  }
  return {
    ...oldMetaData,
    ...metaDataDiff,
    attachments: newAttachments,
    category_displayname: newMetaData.category_displayname,
  };
};

interface Props {
  currentMetaData: ExamMetaData;
  toggle: () => void;
  onMetaDataChange: (newMetaData: ExamMetaData) => void;
}
const ExamMetadataEditor: React.FC<Props> = ({
  currentMetaData,
  toggle,
  onMetaDataChange,
}) => {
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
  const { loading, error, run: runApplyChanges } = useRequest(applyChanges, {
    manual: true,
    onSuccess: newMetaData => {
      toggle();
      onMetaDataChange(newMetaData);
    },
  });
  const [draftState, setDraftState] = useInitialState<ExamMetaDataDraft>(
    currentMetaData,
  );
  const setKey = <T, K extends keyof ExamMetaDataDraft>(
    key: K,
    value: ExamMetaDataDraft[K],
  ) => {
    setDraftState(prevState => ({
      ...prevState,
      [key]: value,
    }));
  };
  const [printonlyFile, setPrintonlyFile] = useInitialState<
    File | true | undefined
  >(currentMetaData.is_printonly ? true : undefined);
  const [masterFile, setMasterFile] = useInitialState<File | true | undefined>(
    currentMetaData.has_solution ? true : undefined,
  );
  const save = () => {
    runApplyChanges(
      currentMetaData.filename,
      currentMetaData,
      draftState,
      printonlyFile,
      masterFile,
    );
  };

  return (
    <>
      <Button close onClick={toggle} />
      <h2>Edit Exam</h2>
      {error && <Alert color="danger">{error.message}</Alert>}
      <h6>Meta Data</h6>
      <Row form>
        <Col md={6}>
          <FormGroup>
            <label className="form-input-label">Display name</label>
            <Input
              type="text"
              value={draftState.displayname}
              onChange={e => setKey("displayname", e.currentTarget.value)}
            />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <label className="form-input-label">Resolve alias</label>
            <Input
              type="text"
              value={draftState.resolve_alias}
              onChange={e => setKey("resolve_alias", e.currentTarget.value)}
            />
          </FormGroup>
        </Col>
      </Row>
      <Row form>
        <Col md={6}>
          <FormGroup>
            <label className="form-input-label">Category</label>
            <Select
              options={categoryOptions ? (options(categoryOptions) as any) : []}
              value={categoryOptions && categoryOptions[draftState.category]}
              onChange={(e: any) => {
                setKey("category", e.value as string);
                setKey("category_displayname", e.label as string);
              }}
              isLoading={categoriesLoading}
              required
            />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <label className="form-input-label">Exam type</label>
            <Select
              options={options(examTypeOptions)}
              value={
                examTypeOptions[
                  draftState.examtype as keyof typeof examTypeOptions
                ]
              }
              onChange={option =>
                setKey(
                  "examtype",
                  (option as SelectOption<typeof examTypeOptions>).value,
                )
              }
            />
          </FormGroup>
        </Col>
      </Row>
      <Row form>
        <Col md={6}>
          <FormGroup check>
            <Input
              type="checkbox"
              name="check"
              id="isPublic"
              checked={draftState.public}
              onChange={e => setKey("public", e.currentTarget.checked)}
            />
            <Label for="isPublic" check>
              Public
            </Label>
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup check>
            <Input
              type="checkbox"
              name="check"
              id="needsPayment"
              checked={draftState.needs_payment}
              onChange={e => setKey("needs_payment", e.currentTarget.checked)}
            />
            <Label for="needsPayment" check>
              Needs Payment
            </Label>
          </FormGroup>
        </Col>
      </Row>
      <Row form>
        <Col md={6}>
          <FormGroup check>
            <Input
              type="checkbox"
              name="check"
              id="cuts"
              checked={draftState.finished_cuts}
              onChange={e => setKey("finished_cuts", e.currentTarget.checked)}
            />
            <Label for="cuts" check>
              Finished Cuts
            </Label>
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup check>
            <Input
              type="checkbox"
              name="check"
              id="wiki"
              checked={draftState.finished_wiki_transfer}
              onChange={e =>
                setKey("finished_wiki_transfer", e.currentTarget.checked)
              }
            />
            <Label for="wiki" check>
              Finished Wiki Transfer
            </Label>
          </FormGroup>
        </Col>
      </Row>
      <Row form>
        <Col md={6}>
          <FormGroup>
            <label className="form-input-label">Legacy Solution</label>
            <Input
              type="url"
              value={draftState.legacy_solution}
              onChange={e => setKey("legacy_solution", e.currentTarget.value)}
            />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <label className="form-input-label">
              Master Solution <i>(extern)</i>
            </label>
            <Input
              type="url"
              value={draftState.master_solution}
              onChange={e => setKey("master_solution", e.currentTarget.value)}
            />
          </FormGroup>
        </Col>
      </Row>
      <Row form>
        <Col md={6}>
          <FormGroup>
            <label className="form-input-label">Print Only File</label>
            {printonlyFile === true ? (
              <div className="form-control">
                <a
                  href={`/api/exam/pdf/solution/${currentMetaData.filename}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Current File
                </a>
                <Button close onClick={() => setPrintonlyFile(undefined)} />
              </div>
            ) : (
              <FileInput
                value={printonlyFile}
                onChange={e => setPrintonlyFile(e)}
              />
            )}
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <label className="form-input-label">Master Solution</label>
            {masterFile === true ? (
              <div className="form-control">
                <a
                  href={`/api/exam/pdf/solution/${currentMetaData.filename}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Current File
                </a>
                <Button close onClick={() => setMasterFile(undefined)} />
              </div>
            ) : (
              <FileInput value={masterFile} onChange={e => setMasterFile(e)} />
            )}
          </FormGroup>
        </Col>
      </Row>
      <Row form>
        <Col md={12}>
          <FormGroup>
            <label className="form-input-label">Remark</label>
            <TextareaField
              textareaProps={{
                onChange: e => setKey("remark", e.currentTarget.value),
              }}
            >
              {draftState.remark}
            </TextareaField>
          </FormGroup>
        </Col>
      </Row>
      <h6>Attachments</h6>
      <AttachmentsEditor
        attachments={draftState.attachments}
        setAttachments={a => setKey("attachments", a)}
      />
      <ButtonWrapperCard>
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
      </ButtonWrapperCard>
    </>
  );
};
export default ExamMetadataEditor;
