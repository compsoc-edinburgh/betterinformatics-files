import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  TextInput,
  Textarea,
  Button,
  FileInput,
  Notification,
  TagsInput,
  Select,
  Group,
  Text,
  Flex,
  Input,
  List,
  Code,
  Collapse,
  Loader,
  Divider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRequest } from "ahooks";
import { getRedactionPreview, uploadDissertation } from "../api/hooks";
import serverData from "../utils/server-data";

const UploadDissertationPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientValidationError, setClientValidationError] = useState<
    string | null
  >(null);
  const [warningExpanded, setWarningExpanded] = useState(false);

  const previewForm = useForm({
    initialValues: {
      pdf_file: null as File | null,
      words_to_redact: [] as string[],
    },
    validate: {
      pdf_file: (value: File | null) => (value ? null : "PDF file is required"),
    },
  });

  const form = useForm({
    initialValues: {
      title: "",
      field_of_study: [] as string[], // Change to array for TagsInput
      supervisors: "",
      notes: "",
      study_level: "",
      grade_band: undefined as string | undefined, // Optional grade band
      year: new Date().getFullYear(), // Default to current year
    },

    validate: {
      title: (value: string) => (value ? null : "Title is required"),
      field_of_study: (value: string[]) =>
        value.length > 0 ? null : "At least one field of study is required",
      supervisors: (value: string) =>
        value ? null : "Supervisors are required",
      study_level: (value: string) =>
        value ? null : "Study level is required",
      year: (value: number) =>
        value && /^[0-9]{4}$/.test(value.toString())
          ? null
          : "Year must be a 4-digit number",
    },
  });

  const { error: uploadError, run: runUploadDissertation } = useRequest(
    uploadDissertation,
    {
      manual: true,
      onSuccess: data => {
        navigate(`/dissertations/${data.id}`);
      },
      onError: (e?: Error) => {
        setClientValidationError(String(e));
      },
    },
  );

  const {
    error: previewError,
    run: runGetRedactionPreview,
    data: previewData,
    loading: previewLoading,
  } = useRequest(getRedactionPreview, {
    manual: true,
    onError: (e?: Error) => {
      setClientValidationError(String(e));
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setClientValidationError(null);

    if (!previewForm.values.pdf_file) {
      setClientValidationError("Please select a PDF file to upload.");
      return;
    }

    await runUploadDissertation(previewForm.values.pdf_file, {
      // Pass the same words to redact as the preview
      words_to_redact: previewForm.values.words_to_redact.join(","),
      title: values.title,
      field_of_study: values.field_of_study.join(","),
      supervisors: values.supervisors,
      notes: values.notes,
      study_level: values.study_level,
      grade_band: values.grade_band,
      year: values.year,
    });
  };

  const handlePreviewSubmit = async (values: typeof previewForm.values) => {
    if (!values.pdf_file) {
      return;
    }

    await runGetRedactionPreview(
      values.pdf_file,
      values.words_to_redact
        .map(word => word.trim())
        .filter(Boolean)
        .join(","),
    );
  };

  return (
    <Container size="xl">
      <Title order={2} mb="md">
        Upload Your Dissertation
      </Title>
      <Text>
        If you have written your dissertation and want to share it with the
        community (either as a good example, a bad example, or just to
        contribute to the archive for the greater good), you can upload it here.
      </Text>
      <Title order={3} my="md">
        Please read the following important information:
      </Title>
      <List>
        <List.Item>
          Your dissertation <b>will be visible to all logged-in users.</b> Users
          are current University of Edinburgh students with a valid email
          address.
        </List.Item>
        <List.Item>
          As it is internal-only (not indexed by Google, arXiv, etc), uploading
          your dissertation here does not count as a &quot;prior
          publication&quot;. <b>You are able to</b> submit the work to academic
          venues in the future.
        </List.Item>
        <List.Item>
          You <b>can</b> edit the metadata and/or replace the file after
          submission.
        </List.Item>
        <List.Item>
          You <b>can</b> delete the dissertation later if you change your mind.
          If you graduate during this time and lose access to your account, you
          have the right to request deletion of your dissertation by contacting
          admins via publicized contact methods (notably our email, at{" "}
          <a href={`mailto:${serverData.email_address}`}>
            {serverData.email_address}
          </a>
          ).
        </List.Item>
        <List.Item>
          You <b>may choose</b> to redact certain words from the PDF (e.g. your
          name, or any other personally identifiable information) before
          uploading.
          <br />
          <Group>
            If you are doing redaction, please also read the following:
            <Button
              variant="outline"
              size="compact-xs"
              onClick={() => setWarningExpanded(v => !v)}
            >
              {warningExpanded ? "Hide" : "Show"} Important Redaction Warnings
            </Button>
          </Group>
          <Collapse in={warningExpanded}>
            <List>
              <List.Item>
                Redaction of your name <b>does not</b> anonymize you, as your
                upload will be tied to your UUN and this linkage is visible to
                all logged-in users. Furthermore, your research topic,
                supervisors, and other metadata may also make you identifiable.
                You may still want to redact your name to make the connection
                less obvious.
              </List.Item>
              <List.Item>
                The redaction process <b>happens on our servers</b> (as the
                algorithm is complex). The temporary unredacted version is
                stored up to 5 minutes during the redaction process.
              </List.Item>
              <List.Item>
                100% Redaction is <b>not guaranteed</b>. We parse and replace
                the PDF bytestream tokens, but this process cannot deal with
                rasterized or handwritten text in images/figures. You should be
                aware of this, and if you are very concerned, you should redact
                the PDF yourself before uploading (via LaTeX packages like{" "}
                <Code>censor</Code> etc).
              </List.Item>
            </List>
          </Collapse>
        </List.Item>
      </List>
      <Divider my="md" />
      <Flex gap="md" align="stretch">
        <div style={{ flex: 1, maxWidth: "600px" }}>
          <FileInput
            label="Select your dissertation PDF"
            placeholder="Choose PDF file"
            accept="application/pdf"
            mt="md"
            {...previewForm.getInputProps("pdf_file")}
            required
            onChange={e => {
              previewForm.setFieldValue("pdf_file", e);
              void handlePreviewSubmit({
                ...previewForm.values,
                pdf_file: e,
              });
            }}
            rightSection={
              previewLoading ? (
                <Loader size="xs" />
              ) : previewForm.values.pdf_file ? (
                <Input.ClearButton
                  onClick={() => previewForm.setFieldValue("pdf_file", null)}
                />
              ) : undefined
            }
            rightSectionPointerEvents="auto"
          />
          <TagsInput
            label="Any words to redact (comma-separated)."
            description="Please read the warnings above before using this OPTIONAL feature. Note, for the benefit of future students, we recommend against redacting too much."
            placeholder="e.g., FirstName, LastName, OtherPII"
            mt="md"
            data={[]}
            {...previewForm.getInputProps("words_to_redact")}
            onChange={e => {
              previewForm.setFieldValue("words_to_redact", e);
              void handlePreviewSubmit({
                ...previewForm.values,
                words_to_redact: e,
              });
            }}
            rightSection={
              previewLoading ? (
                <Loader size="xs" />
              ) : previewForm.values.words_to_redact.length ? (
                <Input.ClearButton
                  onClick={() =>
                    previewForm.setFieldValue("words_to_redact", [])
                  }
                />
              ) : undefined
            }
            rightSectionPointerEvents="auto"
          />
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="Title of your dissertation"
              placeholder="Investigating the Effects of Better Informatics on Computer Science Education"
              mt="md"
              {...form.getInputProps("title")}
              required
            />

            <TagsInput
              label="Field of Study (Tags)"
              description="Free-form tags. Feel free to choose whatever feels right."
              placeholder="e.g., Education, Machine Learning, Computer Vision"
              mt="md"
              data={[]}
              {...form.getInputProps("field_of_study")}
              clearable
              required
            />

            <TextInput
              label="Primary Supervisors"
              description="No need to include titles (Dr, Prof, etc)."
              placeholder="Alice Smith, Bob Johnson"
              mt="md"
              {...form.getInputProps("supervisors")}
              required
            />

            <Select
              label="Year Written"
              placeholder="Select the year the dissertation was submitted"
              mt="md"
              data={Array.from(
                { length: new Date().getFullYear() - 2009 },
                (_, i) => (2010 + i).toString(),
              ).reverse()}
              {...form.getInputProps("year")}
              required
            />

            <Select
              label="Written for..."
              placeholder="Select study level"
              mt="md"
              data={[
                { value: "UG4", label: "UG4" },
                { value: "UG5", label: "UG5" },
                { value: "MSc", label: "MSc" },
              ]}
              {...form.getInputProps("study_level")}
              required
            />

            <Select
              label="Received Grade Band"
              description="OPTIONAL. Would help future students, but only if you feel comfortable."
              placeholder="Select grade band"
              mt="md"
              data={[
                { value: "40-49", label: "40-49" },
                { value: "50-59", label: "50-59" },
                { value: "60-69", label: "60-69" },
                { value: "70-79", label: "70-79" },
                { value: "80-89", label: "80-89" },
                { value: "90-100", label: "90-100" },
              ]}
              {...form.getInputProps("grade_band")}
              clearable
            />

            <Textarea
              label="Notes"
              description="OPTIONAL. Any feedback you received with the grade, any necessary context, etc."
              placeholder="Any additional notes about the dissertation"
              mt="md"
              minRows={3}
              {...form.getInputProps("notes")}
            />

            {(clientValidationError ?? uploadError?.message) && (
              <Notification title="Upload Failed" color="red" mt="md">
                {clientValidationError ?? uploadError?.message}
              </Notification>
            )}

            <Button type="submit" mt="xl" fullWidth>
              Upload Dissertation
            </Button>
          </form>
        </div>
        <div style={{ flex: 1 }}>
          {previewError && (
            <Notification title="Preview Failed" color="red" mb="md">
              {String(previewError)}
            </Notification>
          )}
          {previewForm.values.pdf_file && previewData && (
            <iframe
              src={previewData}
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          )}
        </div>
      </Flex>
    </Container>
  );
};

export default UploadDissertationPage;
