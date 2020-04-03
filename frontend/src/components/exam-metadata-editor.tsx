import { ExamMetaData } from "../interfaces";
import useInitialState from "../hooks/useInitialState";
import { createOptions, options, SelectOption } from "../ts-utils";
import { useRequest } from "@umijs/hooks";
import {
  Card,
  CardBody,
  Button,
  Alert,
  Row,
  Col,
  FormGroup,
  Input,
  Select,
  TextareaField,
  Label,
  CardFooter,
} from "@vseth/components";
import React from "react";
import AttachmentsEditor, { EditorAttachment } from "./attachments-editor";
import { loadCategories } from "../api/hooks";
import FileInput from "./file-input";
import TwoButtons from "./two-buttons";
import IconButton from "./icon-button";
import { fetchpost } from "../api/fetch-utils";
/*
    'displayname',
    'category',
    'examtype',
    'legacy_solution',
    'master_solution',
    'resolve_alias',
    'remark',
    'public',
    'finished_cuts',
    'finished_wiki_transfer',
    'needs_payment',
    'solution_printonly',
*/
const setMetaData = async (
  filename: string,
  changes: Partial<ExamMetaData>,
) => {
  if (Object.keys(changes).length === 0) return;
  await fetchpost(`/api/exam/setmetadata/${filename}/`, changes);
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
) => {
  const metaDataDiff: Partial<ExamMetaData> = {};
  if (oldMetaData.displayname !== newMetaData.displayname)
    metaDataDiff.displayname = newMetaData.displayname;
  if (oldMetaData.resolve_alias !== newMetaData.resolve_alias)
    metaDataDiff.resolve_alias = newMetaData.resolve_alias;
  if (oldMetaData.category !== newMetaData.category)
    metaDataDiff.category = newMetaData.category;
  if (oldMetaData.examtype !== newMetaData.examtype)
    metaDataDiff.examtype = newMetaData.examtype;
  if (oldMetaData.legacy_solution !== newMetaData.legacy_solution)
    metaDataDiff.legacy_solution = newMetaData.legacy_solution;
  if (oldMetaData.master_solution !== newMetaData.master_solution)
    metaDataDiff.master_solution = newMetaData.master_solution;
  if (oldMetaData.remark !== newMetaData.remark)
    metaDataDiff.remark = newMetaData.remark;
  if (oldMetaData.public !== newMetaData.public)
    metaDataDiff.public = newMetaData.public;
  if (oldMetaData.needs_payment !== newMetaData.needs_payment)
    metaDataDiff.needs_payment = newMetaData.needs_payment;
  if (oldMetaData.finished_cuts !== newMetaData.finished_cuts)
    metaDataDiff.finished_wiki_transfer = newMetaData.finished_wiki_transfer;
  await setMetaData(filename, metaDataDiff);
  return {
    ...oldMetaData,
    ...metaDataDiff,
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
  const [displayName, setDisplayName] = useInitialState(
    currentMetaData.displayname,
  );
  const [resolveAlias, setResolveAlias] = useInitialState(
    currentMetaData.resolve_alias,
  );
  const [category, setCategory] = useInitialState(currentMetaData.category);
  const [examType, setExamType] = useInitialState<keyof typeof examTypeOptions>(
    currentMetaData.examtype as keyof typeof examTypeOptions,
  );
  const [legacySolution, setLegacySolution] = useInitialState(
    currentMetaData.legacy_solution,
  );
  const [masterSolution, setMasterSolution] = useInitialState(
    currentMetaData.master_solution,
  );
  const [remark, setRemark] = useInitialState(currentMetaData.remark);
  const [isPublic, setPublic] = useInitialState(currentMetaData.public);
  const [needsPayment, setNeedsPayment] = useInitialState(
    currentMetaData.needs_payment,
  );
  const [finishedCuts, setFinishedCuts] = useInitialState(
    currentMetaData.finished_cuts,
  );
  const [finishedWiki, setFinishedWiki] = useInitialState(
    currentMetaData.finished_wiki_transfer,
  );
  const [printonlyFile, setPrintonlyFile] = useInitialState<File | undefined>(
    undefined,
  );
  const [masterFile, setMasterFile] = useInitialState<File | undefined>(
    undefined,
  );
  const [attachments, setAttachments] = useInitialState<EditorAttachment[]>(
    currentMetaData.attachments,
  );
  const save = () => {
    runApplyChanges(currentMetaData.filename, currentMetaData, {
      ...currentMetaData,
      displayname: displayName,
      resolve_alias: resolveAlias,
      category: category,
      examtype: examType,
      legacy_solution: legacySolution,
      master_solution: masterSolution,
      remark,
      public: isPublic,
      needs_payment: needsPayment,
      finished_cuts: finishedCuts,
      finished_wiki_transfer: finishedWiki,
    });
  };

  return (
    <Card>
      <CardBody>
        <Button close onClick={toggle} />
        {error && <Alert color="danger">{error.message}</Alert>}
        <h6>Meta Data</h6>
        <Row form>
          <Col md={6}>
            <FormGroup>
              <label className="form-input-label">Display name</label>
              <Input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.currentTarget.value)}
              />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="form-input-label">Resolve alias</label>
              <Input
                type="text"
                value={resolveAlias}
                onChange={e => setResolveAlias(e.currentTarget.value)}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row form>
          <Col md={6}>
            <FormGroup>
              <label className="form-input-label">Category</label>
              <Select
                options={
                  categoryOptions ? (options(categoryOptions) as any) : []
                }
                value={categoryOptions && categoryOptions[category]}
                onChange={(e: any) => setCategory(e.value as string)}
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
                value={examTypeOptions[examType]}
                onChange={option =>
                  setExamType(
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
                checked={isPublic}
                onChange={e => setPublic(e.currentTarget.checked)}
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
                checked={needsPayment}
                onChange={e => setNeedsPayment(e.currentTarget.checked)}
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
                checked={finishedCuts}
                onChange={e => setFinishedCuts(e.currentTarget.checked)}
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
                checked={finishedWiki}
                onChange={e => setFinishedWiki(e.currentTarget.checked)}
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
                value={legacySolution}
                onChange={e => setLegacySolution(e.currentTarget.value)}
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
                value={masterSolution}
                onChange={e => setMasterSolution(e.currentTarget.value)}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row form>
          <Col md={6}>
            <FormGroup>
              <label className="form-input-label">Print Only File</label>
              <FileInput
                value={printonlyFile}
                onChange={e => setPrintonlyFile(e)}
              />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <label className="form-input-label">Master Solution</label>
              <FileInput value={masterFile} onChange={e => setMasterFile(e)} />
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
        <h6>Attachments</h6>
        <AttachmentsEditor
          attachments={attachments}
          setAttachments={setAttachments}
        />
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
export default ExamMetadataEditor;
