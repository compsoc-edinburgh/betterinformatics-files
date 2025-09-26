import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Container, Alert, Text, Title, Autocomplete, Textarea, Notification, Modal, Group, NumberInput, Button, Rating, TextInput, Input, Flex, Center, Box, Card, Stack, useComputedColorScheme} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { fetchPost } from '../api/fetch-utils';
import {TestimonialsTableProps, CourseWithTestimonial} from "./testimonials-page"
import { IconInfoCircle } from '@tabler/icons-react';
import {
    IconPlus,IconCalendarFilled,
  } from "@tabler/icons-react";
import { CategoryMetaData } from "../interfaces";
import { useRequest } from "@umijs/hooks";
import {
  listCategories, loadTestimonials,
} from "../api/testimonials";
import {
  useBICourseList,
} from "../api/hooks";
import { getTableData } from './testimonials-page';

interface CourseNameCategoryLabel {
  value: string; 
  label: string;
}
const AddTestimonialsPage: React.FC<TestimonialsTableProps> = ({data}) => {
    const { category_id, course_name } = useParams<{ category_id?: string; course_name?: string }>();
    const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [listCoursesData, setListCoursesData] = useState<CourseNameCategoryLabel[]>([]);
    const initialCourse = course_name? `${course_name}` : ''
    
    const { data : courses, loading: loading_courses, error: error_courses} = useRequest(
      () => listCategories()
    );
    const { data : testimonials, loading: loading_testimonials, error: error_testimonials } = useRequest(
      () => loadTestimonials()
    );
  
    const [bi_courses_error, bi_courses_loading, bi_courses_data] = useBICourseList();
    //also load the courses!



    useEffect(() => {
      if (course_name && category_id && courses && testimonials && bi_courses_data) {
        setListCoursesData(getTableData(courses, testimonials, bi_courses_data).map((course : CourseWithTestimonial) => ({
          value: `${course.course_name} - ${course.category_id}`, 
          label: course.course_name, 
        })))
      }
      }
        // const found = tableData.find(
        //   (course: CourseWithTestimonial) =>
        //     course.course_name === course_name &&
        //     course.category_id === category_id
        // );
    
        // if (found) {
        //   form.setFieldValue('courseName', `${found.course_name} - ${found.category_id}`);
        // }
      , [course_name, category_id, courses, testimonials, bi_courses_data]);

    const form = useForm({
      initialValues: {
        courseName: initialCourse,
        yearTakenValue: 2025,
        testimonialString: '', 
      },
  
      validate: {
        courseName: (value: string) => (value ? null : 'Course Name is required'),
        yearTakenValue: (value: number) => (value ? null : 'Year Taken is required'),
        testimonialString: (value: string) => (value ? null : "Testimonial is required")
      },
    });
  
    const handleSubmit = async (values: typeof form.values) => {
      setUploadSuccess(null);
      setErrorMessage(null);
  
      // fetchPost expects a plain object, and it will construct FormData internally
      const selectedCategoryId = listCoursesData.find(item => item.label === values.courseName)?.value.split(" - ")[1];
      const dataToSend = {
        category_id: selectedCategoryId,
        year_taken: values.yearTakenValue,
        testimonial: values.testimonialString, 
      };
      //understand thens and comments
      try {
        const response = await fetchPost('/api/testimonials/addtestimonial/', dataToSend);

        if (response.value && response.value["approved"] == true) {
          setUploadSuccess(true);
          form.setInitialValues({
            courseName: '',
            yearTakenValue: 2025,
            testimonialString: '', 
          })
          form.reset();
        } else if (response.value && response.value["approved"] == false) {
            setUploadSuccess(true);
            setErrorMessage("Thank you for submitting your testimonial! We appreciate your feedback. Your message will be reviewed by a moderator before it is published, we will notify you in your Account Page when it has been reviewed.");
        }
        else {
          setUploadSuccess(false);
          setErrorMessage(response.error || 'Unknown error during upload.');
        }
      } catch (error: any) {
        setUploadSuccess(false);
        setErrorMessage(error || 'Network error during upload.');
      }
    };

  return (
    <Container size="sm" mt="xl">
      <Title order={2} ta="center" mb="xl">Add a Course Testimonial</Title>
      {listCoursesData.length > 0 && <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap={10} p={5}>
          <Autocomplete data={listCoursesData} size={"md"} {...form.getInputProps('courseName')} label="Course Name" styles={{ label: {fontSize:"medium"} }} placeholder = "Course Name" required withAsterisk />
          <NumberInput
            size={"md"}
            styles={{ label: { fontSize:"medium"} }}
            leftSection = {<IconCalendarFilled></IconCalendarFilled>}
            {...form.getInputProps('yearTakenValue')}
            label="When did you take this course?"
            placeholder="Year"
            required withAsterisk
          />
          
          <Group gap={3}> 
            <Text style={{fontSize:"medium"}}>Testimonial (Experience, Advice, Study Tips)</Text> <Text style={{color: "red"}}>*</Text> 
          </Group>
          
          <Textarea size={"md"} placeholder = "testimonial.." {...form.getInputProps('testimonialString')}></Textarea> 
          {/* text area */}
            {uploadSuccess === true && errorMessage == null && (
            <Alert title="Successfully added testimonial" variant="light" withCloseButton color="teal" mt="md" onClose={() => setUploadSuccess(null)} icon={<IconInfoCircle />}>
              Thanks for submitting your review, your knowledge will be much appreciated by future UoE students.
            </Alert>
          )}

            {uploadSuccess === true && errorMessage && (
            <Alert title="Testimonial needs a review" variant="light" withCloseButton color="cream" mt="md" onClose={() => setUploadSuccess(null)} icon={<IconInfoCircle />}>
              {errorMessage}
            </Alert>
          )}

          {uploadSuccess === false && errorMessage && (
            <Alert title="Failed to add testimonial" variant="light" withCloseButton color="red" mt="md" onClose={() => setUploadSuccess(null)} icon={<IconInfoCircle />}>
             {errorMessage}
            </Alert>
          )}

          <Button type="submit">Add Testimonial</Button>
        </Stack>
        </form>}
    </Container>
  );
};

export default AddTestimonialsPage;