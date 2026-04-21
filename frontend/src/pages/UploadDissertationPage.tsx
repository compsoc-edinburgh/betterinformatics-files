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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRequest } from "ahooks";
import { uploadDissertation } from "../api/hooks";

const UploadDissertationPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientValidationError, setClientValidationError] = useState<
    string | null
  >(null);

  const form = useForm({
    initialValues: {
      title: "",
      field_of_study: [] as string[], // Change to array for TagsInput
      supervisors: "",
      notes: "",
      pdf_file: null as File | null,
      study_level: "UG4", // Default value
      grade_band: undefined as string | undefined, // Optional grade band
      year: new Date().getFullYear(), // Default to current year
    },

    validate: {
      title: (value: string) => (value ? null : "Title is required"),
      field_of_study: (value: string[]) =>
        value.length > 0 ? null : "At least one field of study is required",
      supervisors: (value: string) =>
        value ? null : "Supervisors are required",
      pdf_file: (value: File | null) => (value ? null : "PDF file is required"),
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

  const handleSubmit = async (values: typeof form.values) => {
    setClientValidationError(null);

    if (!values.pdf_file) {
      setClientValidationError("Please select a PDF file to upload.");
      return;
    }

    await runUploadDissertation(values.pdf_file, {
      title: values.title,
      field_of_study: values.field_of_study.join(","),
      supervisors: values.supervisors,
      notes: values.notes,
      study_level: values.study_level,
      grade_band: values.grade_band,
      year: values.year,
    });
  };

  return (
    <Container size="sm" mt="xl">
      <Title order={2} ta="center" mb="xl">
        Upload Dissertation
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="Title"
          placeholder="Dissertation Title"
          {...form.getInputProps("title")}
          required
        />

        <TagsInput
          label="Field of Study (Tags)"
          placeholder="e.g., AI, Machine Learning, Computer Vision"
          mt="md"
          data={[]}
          {...form.getInputProps("field_of_study")}
          clearable
          required
        />

        <TextInput
          label="Supervisors"
          placeholder="Comma-separated names"
          mt="md"
          {...form.getInputProps("supervisors")}
          required
        />

        <Select
          label="Year"
          placeholder="Select year"
          mt="md"
          data={Array.from(
            { length: new Date().getFullYear() - 2009 },
            (_, i) => (2010 + i).toString(),
          )}
          {...form.getInputProps("year")}
          required
        />

        <Select
          label="Study Level"
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
          label="Grade Band (Optional)"
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
          label="Notes (Optional)"
          placeholder="Any additional notes about the dissertation"
          mt="md"
          minRows={3}
          {...form.getInputProps("notes")}
        />
        <FileInput
          label="Upload PDF"
          placeholder="Choose PDF file"
          accept="application/pdf"
          mt="md"
          {...form.getInputProps("pdf_file")}
          required
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
    </Container>
  );
};

export default UploadDissertationPage;
