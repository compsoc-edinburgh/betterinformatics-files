import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Button,
  Checkbox,
  CloseButton,
  Flex,
  Grid,
  Group,
  NativeSelect,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import React, { useEffect, useState } from "react";
import { downloadIndirect, fetchGet, fetchPost } from "../api/fetch-utils";
import { loadAdminCategories, loadExamTypes } from "../api/hooks";
import useInitialState from "../hooks/useInitialState";
import { Attachment, ExamMetaData } from "../interfaces";
import { createOptions, options } from "../utils/ts-utils";
import AttachmentsEditor, { EditorAttachment } from "./attachments-editor";
import FileInput from "./file-input";
import useForm from "../hooks/useForm";
import { IconDeviceFloppy, IconX } from "@tabler/icons-react";
import Creatable from "./creatable";
const stringKeys = [
  "displayname",
  "category",
  "examtype",
  "master_solution",
  "resolve_alias",
  "remark",
] as const;
const booleanKeys = ["public", "finished_cuts"] as const;

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
const setSolution = async (filename: string, file: File) => {
  await fetchPost(`/api/exam/upload/solution/`, { file, filename });
};
const removeSolution = async (filename: string) => {
  await fetchPost(`/api/exam/remove/solution/${filename}/`, {});
};

export interface ExamMetaDataDraft extends Omit<ExamMetaData, "attachments"> {
  attachments: EditorAttachment[];
}
const applyChanges = async (
  filename: string,
  oldMetaData: ExamMetaData,
  newMetaData: ExamMetaDataDraft,
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

  if (masterSolution === undefined && oldMetaData.has_solution) {
    await removeSolution(filename);
    metaDataDiff.has_solution = false;
  } else if (masterSolution instanceof File) {
    await setSolution(filename, masterSolution);
    metaDataDiff.has_solution = true;
  }
  if (!oldMetaData.has_solution && masterSolution instanceof File) {
    const newUrl = await fetchGet(`/api/exam/pdf/solution/${filename}/`);
    metaDataDiff.solution_file = newUrl.value;
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
  closeEditPage: () => void;
  onMetaDataChange: (newMetaData: ExamMetaData) => void;
}
const ExamMetadataEditor: React.FC<Props> = ({
  currentMetaData,
  closeEditPage,
  onMetaDataChange,
}) => {
  const { data: categories } = useRequest(loadAdminCategories);
  const { data: examTypes } = useRequest(loadExamTypes);
  const categoryOptions =
    categories &&
    createOptions(
      Object.fromEntries(
        categories.map(
          category => [category.slug, category.displayname] as const,
        ),
      ) as { [key: string]: string },
    );

  const [examTypeOptions, setExamTypeOptions] = useState<string[]>([]);
  useEffect(() => {
    setExamTypeOptions(examTypes ?? []);
  }, [examTypes]);

  const {
    loading,
    error,
    run: runApplyChanges,
  } = useRequest(applyChanges, {
    manual: true,
    onSuccess: newMetaData => {
      closeEditPage();
      onMetaDataChange(newMetaData);
    },
  });

  const [masterFile, setMasterFile] = useInitialState<File | true | undefined>(
    currentMetaData.has_solution ? true : undefined,
  );

  const { registerInput, registerCheckbox, formState, setFormValue, onSubmit } =
    useForm(
      currentMetaData as ExamMetaDataDraft,
      values =>
        runApplyChanges(
          currentMetaData.filename,
          currentMetaData,
          values,
          masterFile,
        ),
      ["category", "category_displayname", "examtype", "remark", "attachments"],
    );

  return (
    <Stack mb="xl">
      <Group justify="space-between" pt="sm">
        <Title order={2}>Edit Exam</Title>
        <CloseButton onClick={closeEditPage} />
      </Group>
      {error && <Alert color="red">{error.toString()}</Alert>}
      <Title order={5}>Metadata</Title>
      <Grid>
        <Grid.Col span={{ md: 6 }}>
          <TextInput label="Display name" {...registerInput("displayname")} />
        </Grid.Col>
        <Grid.Col span={{ md: 6 }}>
          <TextInput
            label="Resolve Alias"
            {...registerInput("resolve_alias")}
          />
        </Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ md: 6 }}>
          <NativeSelect
            label="Category"
            data={categoryOptions ? (options(categoryOptions) as any) : []}
            value={categoryOptions && categoryOptions[formState.category].value}
            onChange={(e: any) => {
              const value = e.currentTarget.value;
              setFormValue("category", value as string);
              setFormValue(
                "category_displayname",
                categoryOptions?.[value]?.label ?? value,
              );
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ md: 6 }}>
          <Creatable
            title="Exam type"
            getCreateLabel={(query: string) =>
              `+ Create new exam type "${query}"`
            }
            onCreate={(query: string) => {
              setExamTypeOptions([...(examTypes ?? []), query]);
              return query;
            }}
            data={examTypeOptions}
            value={formState.examtype}
            onChange={(value: string) => setFormValue("examtype", value)}
          />
        </Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ md: 6 }}>
          <Checkbox
            name="check"
            label="Public"
            {...registerCheckbox("public")}
          />
        </Grid.Col>
        <Grid.Col span={{ md: 6 }}>
          <Checkbox
            name="check"
            label="Finished Cuts"
            {...registerCheckbox("finished_cuts")}
          />
        </Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ md: 6 }}>
          <TextInput
            type="url"
            {...registerInput("master_solution")}
            label="Master Solution (extern)"
          />
        </Grid.Col>
        <Grid.Col span={{ md: 6 }}>
          <Text size="sm">Master Solution</Text>
          {masterFile === true ? (
            <Flex align="center" gap="sm">
              <Button
                size="sm"
                onClick={() =>
                  downloadIndirect(
                    `/api/exam/pdf/solution/${currentMetaData.filename}/`,
                  )
                }
              >
                Download Current File
              </Button>
              <CloseButton onClick={() => setMasterFile(undefined)} />
            </Flex>
          ) : (
            <FileInput value={masterFile} onChange={e => setMasterFile(e)} />
          )}
        </Grid.Col>
      </Grid>
      <Textarea label="Remark" {...registerInput("remark")} />
      <Title order={5}>Attachments</Title>
      <AttachmentsEditor
        attachments={formState.attachments}
        setAttachments={a => setFormValue("attachments", a)}
      />
      <Group justify="right">
        <Button leftSection={<IconX />} onClick={closeEditPage} color="dark" variant="light">
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
    </Stack>
  );
};
export default ExamMetadataEditor;
