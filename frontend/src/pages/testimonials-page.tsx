import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useRequest } from "@umijs/hooks";
import sortBy from 'lodash/sortBy';
import {useHistory} from 'react-router-dom'
import { useDisclosure } from '@mantine/hooks';
import { fetchPost, fetchGet } from '../api/fetch-utils';
import { notLoggedIn, SetUserContext, User, UserContext } from "../auth";
import {useEffect, useState, useMemo } from 'react';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import useTitle from '../hooks/useTitle';
import { useDebouncedValue } from '@mantine/hooks';
import { useLocalStorageState } from '@umijs/hooks';
import { Alert, Container, Text, CloseButton, Title, Autocomplete, Textarea, Notification, Modal, Group, NumberInput, Button, Rating, TextInput, Input, Flex, Center, Box, Card, Stack, useComputedColorScheme, ActionIcon} from '@mantine/core';
import KawaiiBetterInformatics from "../assets/kawaii-betterinformatics.svg?react";
import ShimmerButton from '../components/shimmer-button';
import {
  IconPlus,IconSearch, IconX, IconInfoCircle
} from "@tabler/icons-react";

import {
  loadEuclidList,
  loadTestimonials
} from "../api/testimonials";
import ContentContainer from '../components/secondary-container';
import { BICourseDict } from "../interfaces";
import { EuclidCodeBadge } from "../components/euclid-code-badge";
import {
  useBICourseList,
} from "../api/hooks";


//mock data
export type Course = {
  course_code: string,
  course_name: string,
  course_delivery: string,
  course_credits: number,
  course_work_exam_ratio: string,
  course_level: number,
  course_dpmt_link: string
}

export enum ApprovalStatus {
  APPROVED = 0,
  PENDING = 1,
  REJECTED = 2,
}

export type CourseTestimonial = {
  authorId: string,
  authorDisplayName: string,
  euclid_code: string,
  course_name: string,
  testimonial: string,
  id: string,
  year_taken: number
  approval_status: number,
}

export type CourseWithTestimonial = {
  course_code: string,
  course_name: string,
  course_delivery: string,
  course_credits: number,
  course_work_exam_ratio: string,
  course_level: number,
  course_dpmt_link: string,
  testimonials: CourseTestimonial[]
}


export interface ReviewTableProps{
  data: CourseWithTestimonial[],
  user: User | undefined
}

export function getTableData(courses: any, testimonials: any, bi_courses_data: BICourseDict) : CourseWithTestimonial[] {
  let tableData = new Array<CourseWithTestimonial>(1);
  if (courses && testimonials){
    // console.log("Courses loaded in effect:", courses);
    // console.log("Testimonials loaded in effect:", testimonials);
    tableData = new Array<CourseWithTestimonial>(courses.length);
    for (let i = 0; i < courses.length; i++){
      let course = courses[i];
      let currentCourseTestimonials : CourseTestimonial[] = testimonials['value'].filter(
        (testimonial: CourseTestimonial) => (testimonial.euclid_code == course.code && testimonial.approval_status == ApprovalStatus.APPROVED
      ));

      //average of testimonials and etc! 
      let currentCourse = undefined

      for (let key in bi_courses_data) {
        // Ensure the property belongs to the object itself, not its prototype chain
        if (Object.prototype.hasOwnProperty.call(bi_courses_data, key)) {
            const value = bi_courses_data[key];
            //console.log(`${key}: ${value.euclid_code}`);
            //console.log(`${String(value.euclid_code)}: ${course.course_code}`)
            if (String(value.euclid_code) === String(course.code) || String(value.euclid_code_shadow) === String(course.code)) {
              currentCourse = {
                code: course.code,
                acronym: value.acronym,
                name: value.name,
                level: value.level,
                delivery_ordinal: value.delivery_ordinal,
                credits: value.credits,
                cw_exam_ratio: value.cw_exam_ratio,
                course_url: value.course_url,
                euclid_url: value.euclid_url,
                // Set the shadow property to the main course code if this is a shadow
                shadow: value.euclid_code_shadow === course.code ? course.euclid_code : undefined,
              }
          }
        }
      }

      tableData[i] = {
        course_code: course.code,
        course_name: currentCourse? currentCourse.name : "undefined",
        course_delivery: currentCourse? String(currentCourse.delivery_ordinal) : "undefined",
        course_credits: currentCourse? Number(currentCourse.credits) : -1,
        course_work_exam_ratio: currentCourse? String(currentCourse.cw_exam_ratio) : "undefined",
        course_level: currentCourse? Number(currentCourse.level) : -1,
        course_dpmt_link: currentCourse? currentCourse.course_url : "undefined",
        testimonials: currentCourseTestimonials
      }
    }
    console.log("Table data:", tableData);
  }
  return tableData;
}

const TestimonialsPage: React.FC<{}> = () => {
    useTitle("Testimonials");
    const [user, setUser] = useState<User | undefined>(undefined);
    useEffect(() => {
      let cancelled = false;
      if (user === undefined) {
        fetchGet("/api/auth/me/").then(
          res => {
            if (cancelled) return;
            setUser({
              loggedin: res.loggedin,
              username: res.username,
              displayname: res.displayname,
              isAdmin: res.adminrights,
              isCategoryAdmin: res.adminrightscat,
            });
          },
          () => {
            setUser(notLoggedIn);
          },
        );
      }
      return () => {
        cancelled = true;
      };
    }, [user]);

  const [uwu, _] = useLocalStorageState("uwu", false);
  const { data : courses, loading: loading_courses, error: error_courses} = useRequest(
    () => loadEuclidList()
  );
  const { data : testimonials, loading: loading_testimonials, error: error_testimonials } = useRequest(
    () => loadTestimonials()
  );

  const [bi_courses_error, bi_courses_loading, bi_courses_data] = useBICourseList();
    return (
      <>
        <Container size="xl" mb="sm">
          {uwu ? (
            <Container size="sm" mb="lg">
              <KawaiiBetterInformatics />
            </Container>
          ) : (
            <>
              <Text lh={1}>Better&shy;Informatics</Text>
              <Title mb="sm">Course Testimonials</Title>
            </>
          )}
          <Text fw={500}>
            BetterInformatics Course Testimonials is a platform for students to share
            their experiences and study tips in courses that they have taken to help future students make course choices.
          </Text>
        </Container>
        <ContentContainer>
          <Container size="xl" mb="sm">
            {(courses && testimonials && bi_courses_data && <ReviewsTable data={getTableData(courses, testimonials, bi_courses_data)} user={user}/>)||
              ((loading_courses || error_courses || loading_testimonials || error_testimonials || bi_courses_loading || bi_courses_error) && <ReviewsTable data={[]} user={user}/>)
              }
          </Container>
        </ContentContainer>
      </>
    );
}

const ReviewsTable: React.FC<ReviewTableProps> = ({data, user}) => {

  
  const [allData, setAllData] = useState(sortBy(data, 'course_name'));
  
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<CourseWithTestimonial>>({
    columnAccessor: 'course_name',
    direction: 'asc',
  });

  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 200);

  const computedColorScheme = useComputedColorScheme("light");
  const [parent] = useAutoAnimate();

  const history = useHistory();

  useEffect(() => {
    setAllData(sortBy(data, 'course_name'))
  }, [data])

  useEffect(() => {
    const initial_data = sortBy(data, sortStatus.columnAccessor) as CourseWithTestimonial[];
    let updatedData = sortStatus.direction === 'desc' ? initial_data.reverse() : initial_data;
    if (debouncedQuery !== ''){
      updatedData = updatedData.filter((course) => (course.course_name.toLowerCase().includes(debouncedQuery.toLowerCase())))
    }
    setAllData(updatedData);
  }, [sortStatus, debouncedQuery]);

  return <>
      <DataTable
        withRowBorders
        striped
        highlightOnHover
        textSelectionDisabled
        // noRecordsIcon={allData?.length === 0 ? <></> : <></> }
        // noRecordsText={allData?.length === 0 ? "No records to show" : ""}
        //scrollAreaProps={{ type: 'never' }}
        columns = {[
          {
            accessor: 'course_code',
            title: 'Course Code',
            width: "12%",
            sortable: true,
          },
          {
            accessor: 'course_name',
            title: 'Course Name',
            sortable: true,
            render: (record, index) => (
              <Text>{record.course_name}</Text>
            ),
            filter: (
              <TextInput
                label="Course Name"
                description="Filter by Course Name"
                placeholder="Search courses..."
                leftSection={<IconSearch size={16} />}
                rightSection={
                  <ActionIcon size="sm" variant="transparent" c="dimmed" onClick={() => setQuery('')}>
                    <IconX size={14} />
                  </ActionIcon>
                }
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
              />
            ),
            filtering: query !== '',
            // minSize:100,
            // maxSize:450,
          },
          {
            accessor: 'course_delivery',
            title: 'Delivery',
            sortable: true,
          },
          {
            accessor: 'course_credits',
            title: 'Credits',
            sortable: true,
          },
          {
            accessor: 'course_work_exam_ratio',
            title: 'Work%/Exam%',
            sortable: true,
          },
          {
            accessor: 'course_level',
            title: 'Level',
            sortable: true,
          },
          {
            accessor: 'testimonials',
            title: 'No. Testimonials',
            sortable: true,
            render: (record, index) => (
              <Text>{record.testimonials.length}</Text>
            )

          }

        ]}
        records ={allData}
        idAccessor="course_code"
        rowExpansion={{
          // expanded: {
          //   recordIds: expandedRecordIds,
          //   onRecordIdsChange: setExpandedRecordIds,
          // },
          collapseProps: {
            transitionDuration: 150,
            animateOpacity: false,
            transitionTimingFunction: 'ease-out',
          },
          allowMultiple: true,
          content: ({ record }) => (
            <Stack ref ={parent} p={5}>
              <Flex direction="row" justify="space-between" align="center" p={10}>
                <ShimmerButton
                  onClick={() => history.push(`/addtestimonials/${record.course_code}/${record.course_name}`)}
                  leftSection={<IconPlus />}
                  color={computedColorScheme === "dark" ? "compsocMain" : "dark"}
                  variant="outline"
                >
                  Add new testimonial
                </ShimmerButton>
              </Flex>
              {
                record.testimonials.map((testimonial, index) => //add a key to the testimonial
                  <ReviewCard key={index} currentUserUsername = {String(user == undefined? "": user.username)} isAdmin={user==undefined? false : user.isAdmin} username={String(testimonial.authorId)} displayName={String(testimonial.authorDisplayName)} course_code={testimonial.euclid_code} yearTaken={String(testimonial.year_taken)} testimonial={String(testimonial.testimonial)} testimonial_id={String(testimonial.id)}></ReviewCard>
                )
              }
            </Stack>
          ),
        }}
        //bodyRef={bodyRef}

        //fetching={allData?.length == 0}
        // loaderType={"oval"}
        // loaderSize={"lg"}
        // loaderColor={"blue"}
        // loaderBackgroundBlur={1}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
    />
    </>;
};

interface ratingProps{
  ratingType: String, ratingLevel: String
}

const RatingBox: React.FC<ratingProps> = ({ratingType, ratingLevel}) => {
  return (
    <Text p={2} pl={7} pr={7} bg="gray.3" style={(theme) => ({ borderRadius: theme.radius.md, textAlign: 'center', fontSize: 'medium'})}> {ratingType} {ratingLevel}/5 </Text>
  )
}

interface reviewProps{
  currentUserUsername: String, isAdmin:boolean, username: String, displayName: String, course_code: String, yearTaken: String, testimonial:String, testimonial_id:String
}


const ReviewCard: React.FC<reviewProps> = ({currentUserUsername, isAdmin, username, displayName, course_code, yearTaken, testimonial, testimonial_id}) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteSuccess, setDeleteSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const deleteTestimonial = async () => {
    setDeleteSuccess(null);
    setErrorMessage(null);

    const dataToSend = {
      username: username,
      course_code: course_code,
      testimonial_id: testimonial_id,
    };
    try {
      console.log(dataToSend)
      const response = await fetchPost('/api/testimonials/removetestimonial/', dataToSend);
      console.log("Response Remove Testimonial")
      console.log(response.value)

      if (response.value) {
        setDeleteSuccess(true);
        setTimeout(() => (window.location.reload()),1000);
      } else {
        setDeleteSuccess(false);
        setErrorMessage(response.error || 'Unknown error during deletion.');
      }
    } catch (error: any) {
      setDeleteSuccess(false);
      setErrorMessage(error || 'Network error during deletion.');
    }
  }

  return(
      <>
        <Modal opened={opened} onClose={close} title="Delete a testimonial" centered>
          <Stack>
          <Text>Are you sure you'd like to delete your testimonial? This action cannot be undone.</Text>
          
          {deleteSuccess === true && (
            <Alert color="green">Successfully deleted testimonial, refreshing page now...</Alert>
          )}

          {deleteSuccess === false && errorMessage && (
            <Alert color="red">Failed to delete testimonial due to {errorMessage}</Alert>
          )}

          <Flex gap={3} justify="flex-end">
            <Button variant="filled" color="red" onClick={deleteTestimonial}>Delete</Button>
            <Button variant="default" onClick={close}>Cancel</Button>
          </Flex>
          </Stack>
          
        </Modal>

        <Card withBorder={true} radius="md" p={"lg"} style={{
                border: "1px solid black",
                borderRadius: "8px",
                padding: "8px",
                boxShadow: "2px 2px 6px rgba(0, 0, 0, 0.2)",
                display: "inline-block",
            }}>
        <Flex gap='4'>
            <Flex flex='1' gap='4' align='center' wrap={'wrap'}>
                <Text fw={700} component="span">
                  {displayName}
                  {currentUserUsername==username && " (you)"}
                </Text>
                <Text ml="0.3em" color="dimmed" component="span">
                  @{username}
                </Text>
                <Text color="dimmed" mx={6} component="span">
                  ·
                </Text>
                <Text color="dimmed">took the course in {yearTaken}</Text>
            </Flex>
            {(currentUserUsername==username || isAdmin) && <CloseButton p ={0} m={0} onClick={open}></CloseButton>}
            </Flex>
            <Text>
            {testimonial}
            </Text>
        </Card>
        </>
    )
}


export default TestimonialsPage;