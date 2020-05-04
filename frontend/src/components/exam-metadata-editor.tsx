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
  InputField,
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
import useForm from "../hooks/useForm";
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
  for (const key of stringKeys) {
    if (oldMetaData[key] !== newMetaData[key]) {
      metaDataDiff[key] = newMetaData[key];
    }
  }
  for (const key of booleanKeys) {
    if (oldMetaData[key] !== newMetaData[key]) {
      metaDataDiff[key] = newMetaData[key];
    }
  }
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

  const [printonlyFile, setPrintonlyFile] = useInitialState<
    File | true | undefined
  >(currentMetaData.is_printonly ? true : undefined);
  const [masterFile, setMasterFile] = useInitialState<File | true | undefined>(
    currentMetaData.has_solution ? true : undefined,
  );

  const {
    registerInput,
    registerCheckbox,
    formState,
    setFormValue,
    onSubmit,
  } = useForm(
    currentMetaData as ExamMetaDataDraft,
    values =>
      runApplyChanges(
        currentMetaData.filename,
        currentMetaData,
        values,
        printonlyFile,
        masterFile,
      ),
    ["category", "category_displayname", "examtype", "remark", "attachments"],
  );

  return (
    <>
      <Button close onClick={toggle} />
      <h2>Edit Exam</h2>
      {error && <Alert color="danger">{error.toString()}</Alert>}
      <h6>Meta Data</h6>
      <Row form>
        <Col md={6}>
          <InputField
            type="text"
            label="Display name"
            {...registerInput("displayname")}
          />
        </Col>
        <Col md={6}>
          <InputField
            type="text"
            label="Resolve Alias"
            {...registerInput("resolve_alias")}
          />
        </Col>
      </Row>
      <Row form>
        <Col md={6}>
          <FormGroup>
            <label className="form-input-label">Category</label>
            <Select
              options={categoryOptions ? (options(categoryOptions) as any) : []}
              value={categoryOptions && categoryOptions[formState.category]}
              onChange={(e: any) => {
                setFormValue("category", e.value as string);
                setFormValue("category_displayname", e.label as string);
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
                  formState.examtype as keyof typeof examTypeOptions
                ]
              }
              onChange={option =>
                setFormValue(
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
              {...registerCheckbox("public")}
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
              {...registerCheckbox("needs_payment")}
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
              {...registerCheckbox("finished_cuts")}
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
              label="Finished Wiki Transfer"
              name="check"
              id="wiki"
              {...registerCheckbox("finished_wiki_transfer")}
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
            <Input type="url" {...registerInput("legacy_solution")} />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <label className="form-input-label">
              Master Solution <i>(extern)</i>
            </label>
            <Input type="url" {...registerInput("master_solution")} />
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
                onChange: e => setFormValue("remark", e.currentTarget.value),
              }}
            >
              {formState.remark}
            </TextareaField>
          </FormGroup>
        </Col>
      </Row>
      <h6>Attachments</h6>
      <AttachmentsEditor
        attachments={formState.attachments}
        setAttachments={a => setFormValue("attachments", a)}
      />
      <ButtonWrapperCard>
        <TwoButtons
          left={
            <IconButton
              icon="SAVE"
              color="primary"
              loading={loading}
              onClick={onSubmit}
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
