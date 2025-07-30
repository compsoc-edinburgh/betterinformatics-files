import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Container, Alert, Text, Title, Autocomplete, Textarea, Notification, Modal, Group, NumberInput, Button, Rating, TextInput, Input, Flex, Center, Box, Card, Stack, useComputedColorScheme} from '@mantine/core';
import { useForm } from '@mantine/form';
import { fetchPost } from '../api/fetch-utils';
import {ReviewTableProps} from "./testimonials-page"
import { IconInfoCircle } from '@tabler/icons-react';
import {
    IconPlus,IconCalendarFilled,
  } from "@tabler/icons-react";
import {
loadCourses,
} from "../api/hooks";
import { useRequest } from "@umijs/hooks";

type Course = {
    course_code: string,
    course_name: string,
    course_delivery: string,
    course_credits: number,
    course_work_exam_ratio: string,
    course_level: number,
    course_dpmt_link: string
  }
const AddTestimonialsPage: React.FC<ReviewTableProps> = ({data}) => {
    const history = useHistory();
    const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { data : courses, loading: loading_courses, error: error_courses} = useRequest(
        () => loadCourses()
      );
    const form = useForm({
      initialValues: {
        courseName: '',
        yearTakenValue: 2025,
        difficultyRating: 0,
        workloadRating: 0,
        recommendabilityRating: 0,
        testimonialString: '', 
      },
  
      validate: {
        courseName: (value: string) => (value ? null : 'Course Name is required'),
        yearTakenValue: (value: number) => (value ? null : 'Year Taken is required'),
        difficultyRating: (value: number) => (value ? null : 'Supervisors are required'),
        workloadRating: (value: number) => (value ? null : 'PDF file is required'),
        recommendabilityRating: (value: number) => (value ? null : 'Study level is required'),
        testimonialString: (value: string) => (value ? null : "Testimonial is required")
      },
    });
  
    const handleSubmit = async (values: typeof form.values) => {
      setUploadSuccess(null);
      setErrorMessage(null);
  
      // fetchPost expects a plain object, and it will construct FormData internally
      console.log(values.courseName.split(" - ")[0])
      const dataToSend = {
        course: values.courseName.split(" - ")[0],
        year_taken: values.yearTakenValue,
        difficulty_rating: values.difficultyRating,
        workload_rating: values.workloadRating,
        recommendability_rating: values.recommendabilityRating,
        testimonial: values.testimonialString, 
      };
  
      try {
        const response = await fetchPost('/api/testimonials/addtestimonial/', dataToSend);
        console.log("Response Add Testimonial")
        console.log(response.value)
        if (response.value) {
          setUploadSuccess(true);
          form.reset();
          //history.push('/testimonials'); // Redirect to testimonials page on success
          //reload the table
        } else {
          setUploadSuccess(false);
          setErrorMessage(response.error || 'Unknown error during upload.');
        }
      } catch (error: any) {
        setUploadSuccess(false);
        console.log(error)
        setErrorMessage(error || 'Network error during upload.');
      }
    };

  return (
    <Container size="sm" mt="xl">
      <Title order={2} ta="center" mb="xl">Add a Course Testimonial</Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap={10} p={5}>
          
          <Autocomplete data={courses == undefined? []: courses["value"].map((course : Course) => course.course_code + " - " + course.course_name)} size={"md"} {...form.getInputProps('courseName')} label="Course Name" styles={{ label: {fontSize:"medium"} }} placeholder = "Course Name" required withAsterisk />
          <NumberInput
            size={"md"}
            styles={{ label: { fontSize:"medium"} }}
            leftSection = {<IconCalendarFilled></IconCalendarFilled>}
            {...form.getInputProps('yearTakenValue')}
            label="When did you take this course?"
            placeholder="Year"
            required withAsterisk
          />
          <Text style={{fontSize:"medium"}}>Ratings</Text>
          <Stack style={{border : "solid 1px", borderRadius: 5, borderColor: "lightgray", padding:10}}>
            <Flex>
              <Group gap={3}>
                <Text>Recommendability</Text> <Text style={{color: "red"}}>*</Text>
                {/* On a scale of 1-5, how likely are you to recommend this course? */}
              </Group>
              <Rating style={{ marginLeft: 'auto' }} fractions={2} {...form.getInputProps('recommendabilityRating')} size={"lg"}></Rating>
            </Flex>
            <Flex>
              <Group gap={3}>
                <Text>Workload</Text> <Text style={{color: "red"}}>*</Text>
                {/* On a scale of 1-5, how much workload was involved in the course? */}
              </Group>
              <Rating style={{ marginLeft: 'auto' }} fractions={2} {...form.getInputProps('workloadRating')} size={"lg"}></Rating>
            </Flex>
            <Flex>
              <Group gap={3}> 
                <Text>Difficulty</Text> <Text style={{color: "red"}}>*</Text> 
                {/* On a scale of 1-5, how difficult did you find the course? */}
              </Group>
              <Rating style={{ marginLeft: 'auto' }} fractions={2} {...form.getInputProps('difficultyRating')} size={"lg"}></Rating>
            </Flex>

          </Stack>
          
          
          <Text style={{fontSize:"medium"}}>Testimonial (Experience, Advice, Study Tips)</Text>
          
          <Textarea size={"md"} placeholder = "testimonial.." {...form.getInputProps('testimonialString')}></Textarea> 
          {/* text area */}
            {uploadSuccess === true && (
            <Alert title="Successfully added testimonial" variant="light" withCloseButton color="teal" mt="md" onClose={() => setUploadSuccess(null)} icon={<IconInfoCircle />}>
              Thanks for submitting your review, your knowledge will be much appreciated by future UoE students.
            </Alert>
          )}

          {uploadSuccess === false && errorMessage && (
            <Alert title="Failed to add testimonial" variant="light" withCloseButton color="red" mt="md" onClose={() => setUploadSuccess(null)} icon={<IconInfoCircle />}>
             {errorMessage}
            </Alert>
          )}

          <Button type="submit">Add Testimonial</Button>
        </Stack>
        </form>
    </Container>
  );
};

export default AddTestimonialsPage;