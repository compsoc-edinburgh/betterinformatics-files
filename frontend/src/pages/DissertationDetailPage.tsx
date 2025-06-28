import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Title, Text, LoadingOverlay, Notification, Paper, Group, Stack, Badge } from '@mantine/core';
import { fetchGet } from '../api/fetch-utils';
import { IconBook, IconUsers, IconCalendar, IconFileDescription } from '@tabler/icons-react';

interface Dissertation {
  id: number;
  title: string;
  field_of_study: string;
  supervisors: string;
  notes: string;
  file_path: string;
  uploaded_by: string;
  upload_date: string;
  study_level: string;
  grade_band?: string; // Optional grade band
}

const DissertationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [dissertation, setDissertation] = useState<Dissertation | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDissertationAndPdf = async () => {
      setLoading(true);
      setError(null);
      try {
        const dissertationResponse = await fetchGet(`/api/dissertations/${id}/`);
        if (dissertationResponse.value) {
          setDissertation(dissertationResponse.value);

          const pdfResponse = await fetchGet(`/api/dissertations/${id}/download/`);
          if (pdfResponse.value) {
            setPdfUrl(pdfResponse.value);
          } else {
            setError(pdfResponse.error || 'Failed to get PDF URL.');
          }
        } else {
          setError(dissertationResponse.error || 'Failed to fetch dissertation details.');
        }
      } catch (err: any) {
        setError(err.message || 'Network error while fetching dissertation details or PDF URL.');
      } finally {
        setLoading(false);
      }
    };

    fetchDissertationAndPdf();
  }, [id]);

  if (loading) {
    return (
      <Container size="xl" mt="xl" style={{ position: 'relative', minHeight: '300px' }}>
        <LoadingOverlay visible={true} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" mt="xl">
        <Notification title="Error" color="red">
          {error}
        </Notification>
      </Container>
    );
  }

  if (!dissertation) {
    return (
      <Container size="xl" mt="xl">
        <Notification title="Not Found" color="blue">
          Dissertation not found.
        </Notification>
      </Container>
    );
  }

  return (
    <Container size="xl" mt="xl">
      <Title order={2} ta="center" mb="xl">{dissertation.title}</Title>

      <Paper shadow="sm" p="lg" mb="xl" withBorder>
        <Stack gap="sm">
          <Group align="center">
            <IconBook size={20} />
            <Text fw={500}>Field of Study:</Text>
            <Group gap={4}>
              {dissertation.field_of_study.split(',').map((field, index) => (
                <Badge key={index} variant="light">
                  {field.trim()}
                </Badge>
              ))}
            </Group>
          </Group>
          <Group>
            <IconUsers size={20} />
            <Text fw={500}>Supervisors:</Text>
            <Text>{dissertation.supervisors}</Text>
          </Group>
          <Group>
            <IconCalendar size={20} />
            <Text fw={500}>Upload Date:</Text>
            <Text>{new Date(dissertation.upload_date).toLocaleDateString()}</Text>
          </Group>
          <Group>
            <IconFileDescription size={20} />
            <Text fw={500}>Uploaded By:</Text>
            <Text>{dissertation.uploaded_by}</Text>
          </Group>
          <Group>
            <IconBook size={20} />
            <Text fw={500}>Study Level:</Text>
            <Text>{dissertation.study_level}</Text>
          </Group>
          {dissertation.grade_band && (
            <Group>
              <IconBook size={20} />
              <Text fw={500}>Grade Band:</Text>
              <Text>{dissertation.grade_band}</Text>
            </Group>
          )}
          {dissertation.notes && (
            <Stack gap={4}>
              <Text fw={500}>Notes:</Text>
              <Text>{dissertation.notes}</Text>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Title order={3} ta="center" mb="md">PDF Viewer</Title>
      <Paper shadow="sm" p="sm" withBorder style={{ height: '80vh' }}>
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title={dissertation.title}
          />
        ) : (
          <Text ta="center" c="red">Failed to load PDF.</Text>
        )}
      </Paper>
    </Container>
  );
};

export default DissertationDetailPage;