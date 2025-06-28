import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Container, Title, TextInput, Textarea, Button, FileInput, Notification, TagsInput, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { fetchPost } from '../api/fetch-utils';

const UploadDissertationPage: React.FC = () => {
  const history = useHistory();
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      title: '',
      field_of_study: [] as string[], // Change to array for TagsInput
      supervisors: '',
      notes: '',
      pdf_file: null as File | null,
      study_level: 'UG4', // Default value
      grade_band: null as string | null, // Optional grade band
    },

    validate: {
      title: (value: string) => (value ? null : 'Title is required'),
      field_of_study: (value: string[]) => (value.length > 0 ? null : 'At least one field of study is required'),
      supervisors: (value: string) => (value ? null : 'Supervisors are required'),
      pdf_file: (value: File | null) => (value ? null : 'PDF file is required'),
      study_level: (value: string) => (value ? null : 'Study level is required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setUploadSuccess(null);
    setErrorMessage(null);

    // fetchPost expects a plain object, and it will construct FormData internally
    const dataToSend = {
      title: values.title,
      field_of_study: values.field_of_study.join(','), // Join array into comma-separated string
      supervisors: values.supervisors,
      notes: values.notes,
      pdf_file: values.pdf_file, // fetch-utils will handle File/Blob instances
      study_level: values.study_level,
      grade_band: values.grade_band, // Include grade band
    };

    try {
      const response = await fetchPost('/api/dissertations/upload/', dataToSend);
      if (response.value) {
        history.push('/dissertations'); // Redirect to list page on success
      } else {
        setUploadSuccess(false);
        setErrorMessage(response.error || 'Unknown error during upload.');
      }
    } catch (error: any) {
      setUploadSuccess(false);
      setErrorMessage(error.message || 'Network error during upload.');
    }
  };

  return (
    <Container size="sm" mt="xl">
      <Title order={2} ta="center" mb="xl">Upload Dissertation</Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="Title"
          placeholder="Dissertation Title"
          {...form.getInputProps('title')}
          required
        />

        <TagsInput
          label="Field of Study (Tags)"
          placeholder="e.g., AI, Machine Learning, Computer Vision"
          mt="md"
          data={[]}
          {...form.getInputProps('field_of_study')}
          clearable
          required
        />

        <TextInput
          label="Supervisors"
          placeholder="Comma-separated names"
          mt="md"
          {...form.getInputProps('supervisors')}
          required
        />

        <Select
          label="Study Level"
          placeholder="Select study level"
          mt="md"
          data={[
            { value: 'UG4', label: 'UG4' },
            { value: 'UG5', label: 'UG5' },
            { value: 'MSc', label: 'MSc' },
          ]}
          {...form.getInputProps('study_level')}
          required
        />

        <Select
          label="Grade Band (Optional)"
          placeholder="Select grade band"
          mt="md"
          data={[
            { value: '40-49', label: '40-49' },
            { value: '50-59', label: '50-59' },
            { value: '60-69', label: '60-69' },
            { value: '70-79', label: '70-79' },
            { value: '80-89', label: '80-89' },
            { value: '90-100', label: '90-100' },
          ]}
          {...form.getInputProps('grade_band')}
          clearable
        />

        <Textarea
          label="Notes (Optional)"
          placeholder="Any additional notes about the dissertation"
          mt="md"
          minRows={3}
          {...form.getInputProps('notes')}
        />
        <FileInput
          label="Upload PDF"
          placeholder="Choose PDF file"
          accept="application/pdf"
          mt="md"
          {...form.getInputProps('pdf_file')}
          required
        />

        {uploadSuccess === true && (
          <Notification title="Success" color="teal" mt="md" onClose={() => setUploadSuccess(null)}>
            Dissertation uploaded successfully!
          </Notification>
        )}

        {uploadSuccess === false && errorMessage && (
          <Notification title="Upload Failed" color="red" mt="md" onClose={() => setUploadSuccess(null)}>
            {errorMessage}
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