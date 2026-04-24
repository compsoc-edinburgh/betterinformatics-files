import React, { useCallback, useMemo, useState } from "react";
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
  MultiSelect,
  CloseButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRequest } from "ahooks";
import {
  deleteDissertation,
  editDissertation,
  getRedactionPreview,
  loadCategories,
  uploadDissertation,
} from "../api/hooks";
import serverData from "../utils/server-data";
import { Dissertation } from "../interfaces";
import useRemoveConfirm from "../hooks/useRemoveConfirm";

interface Props {
  editing_existing?: Dissertation;
  onEdit?: () => void;
}

const DissertationUploadPage: React.FC<Props> = ({
  editing_existing,
  onEdit,
}) => {
  const navigate = useNavigate();
  const [clientValidationError, setClientValidationError] = useState<
    string | null
  >(null);
  const [warningExpanded, setWarningExpanded] = useState(false);
  const [editFileWarningVisible, setEditFileWarningVisible] =
    useState(!!editing_existing);

  const {
    error: categoriesError,
    loading: categoriesLoading,
    data: categories,
  } = useRequest(loadCategories);

  const options = useMemo(
    () =>
      categories?.map(category => ({
        value: category.slug,
        label: category.displayname,
      })) ?? [],
    [categories],
  );

  // Preview form is separate since we want to auto-submit this and preview it
  // whenever the user changes words to redact. The values are still used for
  // the main form submission.
  const previewForm = useForm({
    initialValues: {
      pdf_file: null as File | null,
      words_to_redact: [] as string[],
    },
    validate: {
      pdf_file: (value: File | null) =>
        // Only require PDF for new uploads
        value || editing_existing ? null : "PDF file is required",
    },
  });

  // Main form
  const form = useForm({
    initialValues: {
      title: editing_existing ? editing_existing.title : "",
      field_of_study: editing_existing
        ? editing_existing.field_of_study
            .split(",")
            .filter(field => field.trim() !== "")
            .map(s => s.trim())
        : [],
      supervisors: editing_existing ? editing_existing.supervisors : "",
      notes: editing_existing ? editing_existing.notes : "",
      study_level: editing_existing ? editing_existing.study_level : "",
      grade_band:
        editing_existing?.grade_band ?? (undefined as string | undefined),
      // Mantine Select only accepts strings as data - we need to convert back
      // when we submit
      year: editing_existing
        ? editing_existing.year.toString()
        : new Date().getFullYear().toString(),
      relevant_categories: editing_existing
        ? editing_existing.relevant_categories.map(c => c.slug)
        : ([] as string[]),
    },

    validate: {
      title: (value: string) => (value ? null : "Title is required"),
      supervisors: (value: string) =>
        value ? null : "Supervisors are required",
      study_level: (value: string) =>
        value ? null : "Study level is required",
      year: (value: string) =>
        value && /^[0-9]{4}$/.test(value)
          ? null
          : "Year must be a 4-digit number",
    },
  });

  const { error: editError, run: runEditDissertation } = useRequest(
    editDissertation,
    {
      manual: true,
      onSuccess: data => {
        onEdit?.();
        navigate(`/dissertations/${data.id}`);
      },
      onError: (e?: Error) => {
        setClientValidationError(String(e));
      },
    },
  );

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

  const [removeConfirm, modals] = useRemoveConfirm();
  const { run: runDeleteDissertation } = useRequest(deleteDissertation, {
    manual: true,
    onSuccess: () => {
      navigate("/dissertations");
    },
    onError: (e?: Error) => {
      setClientValidationError(String(e));
    },
  });
  const remove = useCallback(() => {
    if (editing_existing) {
      removeConfirm(
        "Are you sure you want to delete this dissertation? This action cannot be undone.",
        () => void runDeleteDissertation(editing_existing.id),
      );
    }
  }, [removeConfirm, runDeleteDissertation, editing_existing]);

  const handleSubmit = async (values: typeof form.values) => {
    setClientValidationError(null);

    if (!editing_existing) {
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
        year: Number(values.year),
        relevant_categories: values.relevant_categories,
      });
    } else {
      await runEditDissertation(
        previewForm.values.pdf_file,
        editing_existing.id,
        {
          words_to_redact: previewForm.values.words_to_redact.join(","),
          title: values.title,
          field_of_study: values.field_of_study.join(","),
          supervisors: values.supervisors,
          notes: values.notes,
          study_level: values.study_level,
          grade_band: values.grade_band,
          year: Number(values.year),
          relevant_categories: values.relevant_categories,
        },
      );
    }
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
    <Container
      size="xl"
      px={
        /*disable padding if this page is being embedded*/
        editing_existing ? 0 : undefined
      }
    >
      <Group justify="space-between" mb="md">
        <Title order={2}>
          {editing_existing ? "Edit your" : "Upload a new"} Dissertation
        </Title>
        {editing_existing && <CloseButton onClick={_ => navigate(-1)} />}
      </Group>

      {!editing_existing && (
        <>
          <Text>
            If you have written your dissertation and want to share it with the
            community (either as a good example, a bad example, or just to
            contribute to the archive for the greater good), you can upload it
            here.
          </Text>
          <Title order={3} my="md">
            Please read the following important information:
          </Title>
          <List>
            <List.Item>
              Your dissertation <b>will be visible to all logged-in users.</b>{" "}
              Users are current University of Edinburgh students with a valid
              email address.
            </List.Item>
            <List.Item>
              As it is internal-only (not indexed by Google, arXiv, etc),
              uploading your dissertation here does not count as a &quot;prior
              publication&quot;. <b>You are able to</b> submit the work to
              academic venues in the future.
            </List.Item>
            <List.Item>
              You <b>can</b> edit the metadata and/or replace the file after
              submission.
            </List.Item>
            <List.Item>
              You <b>can</b> delete the dissertation later if you change your
              mind. If you graduate during this time and lose access to your
              account, you have the right to request deletion of your
              dissertation by contacting admins via publicized contact methods
              (notably our email, at{" "}
              <a href={`mailto:${serverData.email_address}`}>
                {serverData.email_address}
              </a>
              ).
            </List.Item>
            <List.Item>
              You <b>may choose</b> to redact certain words from the PDF (e.g.
              your name, or any other personally identifiable information)
              before uploading.
              <br />
              <Group>
                If you are doing redaction, please also read the following:
                <Button
                  variant="outline"
                  size="compact-xs"
                  onClick={() => setWarningExpanded(v => !v)}
                >
                  {warningExpanded ? "Hide" : "Show"} Important Redaction
                  Warnings
                </Button>
              </Group>
              <Collapse in={warningExpanded}>
                <List>
                  <List.Item>
                    Redaction of your name <b>does not</b> anonymize you, as
                    your upload will be tied to your UUN and this linkage is
                    visible to all logged-in users. Furthermore, your research
                    topic, supervisors, and other metadata may also make you
                    identifiable. You may still want to redact your name to make
                    the connection less obvious.
                  </List.Item>
                  <List.Item>
                    The redaction process <b>happens on our servers</b> (as the
                    algorithm is complex). The temporary unredacted version is
                    stored up to 5 minutes during the redaction process.
                  </List.Item>
                  <List.Item>
                    100% Redaction is <b>not guaranteed</b>. We parse and
                    replace the PDF bytestream tokens, but this process cannot
                    deal with rasterized or handwritten text in images/figures.
                    You should be aware of this, and if you are very concerned,
                    you should redact the PDF yourself before uploading (via
                    LaTeX packages like <Code>censor</Code> etc).
                  </List.Item>
                </List>
              </Collapse>
            </List.Item>
          </List>
          <Divider my="md" />
        </>
      )}
      <Flex gap="md" align="stretch">
        <div style={{ flex: 1, maxWidth: "600px" }}>
          {editFileWarningVisible ? (
            <Notification color="yellow" mb="md" withCloseButton={false}>
              You already have a file uploaded. Do you want to replace the
              existing PDF file or edit the redaction? Do not click the button
              below if you only want to edit the metadata.
              <Group mt="xs">
                <Button
                  variant="outline"
                  size="compact-xs"
                  onClick={() => setEditFileWarningVisible(false)}
                >
                  I understand, let me upload a new file
                </Button>
              </Group>
            </Notification>
          ) : (
            <>
              <FileInput
                label="Select your dissertation PDF"
                placeholder="Choose PDF file"
                accept="application/pdf"
                mt="md"
                {...previewForm.getInputProps("pdf_file")}
                required={!editing_existing} // Only require PDF for new uploads
                onChange={e => {
                  previewForm.setFieldValue("pdf_file", e);
                  void handlePreviewSubmit({
                    ...previewForm.values,
                    // new form value isn't reflected until next render, so pass
                    // it directly here
                    pdf_file: e,
                  });
                }}
                rightSection={
                  previewLoading ? (
                    <Loader size="xs" />
                  ) : previewForm.values.pdf_file ? (
                    <Input.ClearButton
                      onClick={() =>
                        previewForm.setFieldValue("pdf_file", null)
                      }
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
                    // new form value isn't reflected until next render, so pass
                    // it directly here
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
            </>
          )}
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="Title of your dissertation"
              placeholder="Investigating the Effects of Better Informatics on Computer Science Education"
              mt="md"
              {...form.getInputProps("title")}
              required
            />

            {categoriesError ? (
              <Notification title="Category Error" color="red" mt="md">
                Failed to load list of categories to link to. You can do this
                after uploading. Error details: {String(categoriesError)}
              </Notification>
            ) : (
              <MultiSelect
                label="Relevant Categories"
                description="Select courses that you think helped you the most in this dissertation. This will help future students find relevant dissertations when browsing by course."
                placeholder="Choose..."
                searchable
                mt="md"
                nothingFoundMessage="No category found"
                data={options}
                {...form.getInputProps("relevant_categories")}
                required
                rightSection={
                  categoriesLoading ? <Loader size="xs" /> : undefined
                }
              />
            )}

            <TagsInput
              label="Topic Tags"
              description="OPTIONAL. Comma-separated. Feel free to write whatever feels appropriate."
              placeholder="e.g., Education, Machine Learning, Computer Vision"
              mt="md"
              data={[]}
              {...form.getInputProps("field_of_study")}
              clearable
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

            {(clientValidationError ??
              editError?.message ??
              uploadError?.message) && (
              <Notification title="Upload Failed" color="red" mt="md">
                {clientValidationError ??
                  editError?.message ??
                  uploadError?.message}
              </Notification>
            )}

            <Button type="submit" mt="xl" fullWidth>
              {editing_existing ? "Update" : "Upload"} Dissertation
            </Button>
          </form>
          {editing_existing && (
            <Button
              mt="md"
              onClick={remove}
              color="red"
              variant="outline"
              fullWidth
            >
              Delete Dissertation
            </Button>
          )}
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
      {modals}
    </Container>
  );
};

export default DissertationUploadPage;
