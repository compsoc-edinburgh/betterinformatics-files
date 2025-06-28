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
    },

    validate: {
      title: (value) => (value ? null : 'Title is required'),
      field_of_study: (value) => (value.length > 0 ? null : 'At least one field of study is required'), // Validate array length
      supervisors: (value) => (value ? null : 'Supervisors are required'),
      pdf_file: (value) => (value ? null : 'PDF file is required'),
      study_level: (value) => (value ? null : 'Study level is required'),
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
      <Title order={2} align="center" mb="xl">Upload Dissertation</Title>
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