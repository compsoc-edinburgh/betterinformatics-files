import React, { useEffect, useState } from 'react';
import { Container, Title, Text, LoadingOverlay, Notification, Button, TextInput, Select, Group, Table, Anchor, Badge, CloseButton } from '@mantine/core';
import { fetchGet } from '../api/fetch-utils';
import { Link } from 'react-router-dom';
import { IconUpload, IconSearch } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';

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
  year: number;
}

const DissertationListPage: React.FC = () => {
  const [dissertations, setDissertations] = useState<Dissertation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
  const [searchField, setSearchField] = useState<string | null>('title');

  useEffect(() => {
    const fetchDissertations = async () => {
      setLoading(true);
      setError(null);

      const minLoadTimePromise = new Promise(resolve => setTimeout(resolve, 300)); // Minimum 300ms loading time

      try {
        let url = '/api/dissertations/list/';
        const params = new URLSearchParams();

        if (debouncedSearchQuery) {
          params.append('query', debouncedSearchQuery);
          if (searchField) {
            params.append('field', searchField);
          }
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const [response] = await Promise.all([
          fetchGet(url),
          minLoadTimePromise,
        ]);

        if (response.value) {
          setDissertations(response.value);
        } else {
          setError(response.error || 'Failed to fetch dissertations.');
        }
      } catch (err: any) {
        setError(err.message || 'Network error while fetching dissertations.');
      } finally {
        setLoading(false);
      }
    };

    fetchDissertations();
  }, [debouncedSearchQuery, searchField]);

  const rows = dissertations.map((dissertation) => (
    <Table.Tr key={dissertation.id}>
      <Table.Td>
        <Anchor component={Link} to={`/dissertations/${dissertation.id}`} style={{ textDecorationLine: 'underline', color: 'inherit' }}>
          {dissertation.title}
        </Anchor>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          {dissertation.field_of_study.split(',').map((field, index) => (
            <Badge key={index} variant="light">
              {field.trim()}
            </Badge>
          ))}
        </Group>
      </Table.Td>
      <Table.Td>{dissertation.supervisors}</Table.Td>
      <Table.Td>{dissertation.year}</Table.Td>
      <Table.Td>{dissertation.study_level}</Table.Td>
    </Table.Tr >
  ));

  return (
    <Container size="xl" mt="xl" style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} transitionProps={{ transition: "fade", duration: 200 }} />
      <Title order={2} ta="center" mb="xl">Dissertation Archive</Title>
      <Button component={Link} to="/upload-dissertation" style={{ marginBottom: '20px' }} leftSection={<IconUpload size={14} />}>
        Upload New Dissertation
      </Button>

      <Group grow gap="md">
        <TextInput
          placeholder="Search dissertations..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          rightSection={<CloseButton onClick={() => setSearchQuery('')} style={{ display: searchQuery ? 'block' : 'none' }} />}
        />
        <Select
          placeholder="Search by..."
          value={searchField}
          onChange={setSearchField}
          data={[
            { value: 'title', label: 'Title' },
            { value: 'field_of_study', label: 'Field of Study' },
            { value: 'supervisors', label: 'Supervisors' },
            { value: 'year', label: 'Year' },
          ]}
          clearable
        />
      </Group>

      {error && (
        <Notification title="Error" color="red" onClose={() => setError(null)}>
          {error}
        </Notification>
      )}

      {dissertations.length === 0 && !loading && !error ? (
        <Text ta="center">No dissertations found. Be the first to upload one!</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Field of Study</Table.Th>
              <Table.Th>Supervisors</Table.Th>
              <Table.Th>Year</Table.Th>
              <Table.Th>Level</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      )}
    </Container>
  );
};

export default DissertationListPage;
