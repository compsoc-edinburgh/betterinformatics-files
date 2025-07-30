import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useRequest } from "@umijs/hooks";
import {useHistory} from 'react-router-dom'
import { fetchPost, fetchGet } from '../api/fetch-utils';
import dayjs from 'dayjs';
import {useEffect, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import useTitle from '../hooks/useTitle';
import { useDisclosure } from '@mantine/hooks';
import { useLocalStorageState } from '@umijs/hooks';
import { Container, Text, Title, Autocomplete, Textarea, Notification, Modal, Group, NumberInput, Button, Rating, TextInput, Input, Flex, Center, Box, Card, Stack, useComputedColorScheme} from '@mantine/core';
import KawaiiBetterInformatics from "../assets/kawaii-betterinformatics.svg?react";
import ShimmerButton from '../components/shimmer-button';
import {
  IconPlus,IconCalendarFilled,
} from "@tabler/icons-react";

import {
  loadCourses,
  loadTestimonials
} from "../api/hooks";
import ContentContainer from '../components/secondary-container';
import { table } from 'console';


//mock data
type Course = {
  course_code: string,
  course_name: string,
  course_delivery: string,
  course_credits: number,
  course_work_exam_ratio: string,
  course_level: number,
  course_dpmt_link: string
}

type CourseTestimonial = {
  author: string,
  course: string,
  difficulty_rating: number,
  workload_rating: number,
  recommendability_rating: number,
  testimonial: string,
  year_taken: number
}

type CourseWithTestimonial = { //there is repetition here
  course_code: string,
  course_name: string,
  course_delivery: string,
  course_credits: number,
  course_work_exam_ratio: string,
  course_level: number,
  course_dpmt_link: string,
  course_overall_rating: number,
  course_recommendability_rating: number,
  course_difficulty_rating: number,
  course_workload_rating: number,
  testimonials: CourseTestimonial[]
}


export interface ReviewTableProps{
  data: CourseWithTestimonial[]
}

function getTableData(courses: any, testimonials: any) : CourseWithTestimonial[] {
  let tableData = new Array<CourseWithTestimonial>(1);

  if (courses && testimonials){
    // console.log("Courses loaded in effect:", courses);
    // console.log("Testimonials loaded in effect:", testimonials);
    tableData = new Array<CourseWithTestimonial>(courses['value'].length);
    for (let i = 0; i < courses['value'].length; i++){
      let course = courses['value'][i];
      let currentCourseTestimonials : CourseTestimonial[] = testimonials['value'].filter(
        (testimonial: CourseTestimonial) => (testimonial.course == course.course_code
      ));

      let average_course_difficulty = 0.0;
      let average_course_workload = 0.0;
      let average_course_recommendability = 0.0;

      if (currentCourseTestimonials.length == 0){
        average_course_difficulty = -1;
        average_course_workload = -1;
        average_course_recommendability = -1;
      } else {
        for (let j = 0; j < currentCourseTestimonials.length; j++){
          average_course_difficulty+= currentCourseTestimonials[j].difficulty_rating;
          average_course_recommendability+= currentCourseTestimonials[j].recommendability_rating;
          average_course_workload+= currentCourseTestimonials[j].workload_rating;
        }
        average_course_difficulty /= currentCourseTestimonials.length
        average_course_recommendability /= currentCourseTestimonials.length
        average_course_workload /= currentCourseTestimonials.length
      }

      //average of testimonials and etc! 
      tableData[i] = {
        course_code: course.course_code,
        course_name: course.course_name,
        course_delivery: course.course_delivery,
        course_credits: course.course_credits,
        course_work_exam_ratio: course.course_work_exam_ratio,
        course_level: course.course_level,
        course_dpmt_link: course.course_dpmt_link,
        course_overall_rating: parseFloat(((average_course_recommendability + average_course_difficulty + average_course_workload)/3).toFixed(2)),
        course_recommendability_rating: average_course_recommendability,
        course_difficulty_rating: average_course_difficulty,
        course_workload_rating: average_course_workload,
        testimonials: currentCourseTestimonials
      }
    }
    console.log("Table data:", tableData);
  }
  return tableData;
}

const TestimonialsPage: React.FC<{}> = () => {
    useTitle("Testimonials");
    const [uwu, _] = useLocalStorageState("uwu", false);
    const { data : courses, loading: loading_courses, error: error_courses} = useRequest(
      () => loadCourses()
    );
    const { data : testimonials, loading: loading_testimonials, error: error_testimonials } = useRequest(
      () => loadTestimonials()
    );
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
            {(courses && testimonials && <ReviewsTable data={getTableData(courses, testimonials)}/>)||
              ((loading_courses || error_courses || loading_testimonials || error_testimonials) && <ReviewsTable data={[]}/>)
              }
          </Container>
        </ContentContainer>
      </>
    );
}

function getRatingBox(rating: any) : JSX.Element{
  let ratingsBoxColor = "#A0AEC0"
    if (rating==-1){
      ratingsBoxColor = "#A0AEC0"
    } else if (rating >= 4){
      ratingsBoxColor = "green"
    } else if (rating >= 3){
      ratingsBoxColor = "#D69E2E"
    } else if (rating >= 2){
      ratingsBoxColor = "#DD6B20" //orange
    } else {
      ratingsBoxColor = "'#E53E3E" //red
    }

  return (
  <Center style={{
    alignContent: 'center',
    padding: '4px',
    backgroundColor: ratingsBoxColor,
    borderRadius:3,

  }}>
    {rating == -1? "N/A" : rating}
  </Center>);
}

function addTestimonial(testimonial: CourseTestimonial) {
  console.log(testimonial)

}

const ReviewsTable: React.FC<ReviewTableProps> = ({data}) => {

  const [allData, setAllData] = useState<CourseWithTestimonial[]>();
  useEffect(() => {
    setAllData(data);
  }, [data]);
  const [opened, { open, close }] = useDisclosure(false);

  //Inputs
  // const [courseName, setCourseName] = useState<string>("");
  // const [yearTakenValue, setYearTakenValue] = useState<string | number>(2025); //convert to this year
  // const [difficultyRating, setDifficultyRating] = useState<number>(0);
  // const [workloadRating, setWorkloadRating] = useState<number>(0);
  // const [recommendabilityRating, setRecommendabilityRating] = useState<number>(0);
  // const [testimonialString, setTestimonialString] = useState<string>("");

  const {
    data: courses,
    loading: loadingCourses,
    error: errorCourses,
    refresh: refetchCourses,
  } = useRequest(() => loadCourses());
  
  const {
    data: testimonials,
    loading: loadingTestimonials,
    error: errorTestimonials,
    refresh: refetchTestimonials,
  } = useRequest(() => loadTestimonials());

  const computedColorScheme = useComputedColorScheme("light");
  const [parent] = useAutoAnimate();

  const history = useHistory();
  return <>
      <DataTable
        withTableBorder
        withColumnBorders
        striped
        highlightOnHover
        textSelectionDisabled
        noRecordsIcon={allData?.length === 0 ? <></> : <></> }
        noRecordsText={allData?.length === 0 ? "No records to show" : ""}
        //scrollAreaProps={{ type: 'never' }}
        columns = {[
          {
            accessor: 'course_code',
            title: 'Course Code',
            width: "12%",
          },
          {
            accessor: 'course_name',
            title: 'Course Name',
            // minSize:100,
            // maxSize:450,
          },
          // {
          //   accessor: 'course_delivery',
          //   title: 'Delivery',
          // },
          // {
          //   accessor: 'course_credits',
          //   title: 'Credits',
          // },
          // {
          //   accessor: 'course_work_exam_ratio',
          //   title: 'Work%/Exam%',
          // },
          // {
          //   accessor: 'course_level',
          //   title: 'Level',
          // },
          {
            accessor: 'course_overall_rating',
            title: 'Overall',
            render: ({course_overall_rating}) => (getRatingBox(course_overall_rating)),
            width: "12%",
            // Cell: ({ renderedCellValue, row }) => (
            //   getRatingBox(renderedCellValue)
            // ),
            // size:50
          },
          {
            accessor: 'course_recommendability_rating',
            title: 'Recommendability',
            width: "12%",
            render: ({course_recommendability_rating}) => (getRatingBox(course_recommendability_rating))
            //width:50
          },
          {
            accessor: 'course_workload_rating',
            title: 'Workload',
            render: ({course_workload_rating}) => (getRatingBox(course_workload_rating)),
            width: "12%"
            //width:50
          },
          {
            accessor: 'course_difficulty_rating',
            title: 'Difficulty',
            render: ({course_difficulty_rating}) => (getRatingBox(course_difficulty_rating)),
            width: "12%"
            //width:50
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
                <Text><strong>Overall Recommendation:</strong> {record.course_overall_rating == -1? "N/A" : String(record.course_overall_rating)+"/5"}</Text> 
                <ShimmerButton
                  onClick={() => history.push('/addtestimonials')}
                  leftSection={<IconPlus />}
                  color={computedColorScheme === "dark" ? "compsocMain" : "dark"}
                  variant="outline"
                >
                  Add new testimonial
                </ShimmerButton>
              </Flex>
              {
                record.testimonials.map((testimonial) => //add a key to the testimonial
                  <ReviewCard key="" typeOfStudent={""} yearTaken={String(testimonial.year_taken)} recommendabilityRating={String(testimonial.recommendability_rating)} workloadRating={String(testimonial.workload_rating)} difficultyRating={String(testimonial.difficulty_rating)} testimonial={String(testimonial.testimonial)}></ReviewCard>
                )
              }
            </Stack>
          ),
        }}
        //bodyRef={bodyRef}
        fetching={allData? allData.length == 0 : false}
        // loaderType={"oval"}
        // loaderSize={"lg"}
        // loaderColor={"blue"}
        // loaderBackgroundBlur={1}
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
    typeOfStudent: String, yearTaken: String, recommendabilityRating:String, workloadRating:String, difficultyRating:String, testimonial:String
}

const ReviewCard: React.FC<reviewProps> = ({yearTaken, recommendabilityRating, workloadRating, difficultyRating, testimonial}) => {
    return(
        <Card withBorder={true} radius="md" p={"lg"}>
        <Flex gap='4'>
            <Flex flex='1' gap='4' align='center' wrap={'wrap'}>
                <Box w={"100%"}>
                <Text><strong>s2236467</strong></Text>
                <Flex direction={"row"} gap="3">
                <RatingBox ratingType={"Recommendability:"} ratingLevel={recommendabilityRating}></RatingBox>
                <RatingBox ratingType={"Workload:"} ratingLevel={workloadRating}></RatingBox>
                <RatingBox ratingType={"Difficulty:"} ratingLevel={difficultyRating}></RatingBox>
                </Flex>
                </Box>
            </Flex>
            <Text>Year Course Taken: <strong>{yearTaken}</strong></Text>
            </Flex>
            <Text style={{"fontStyle":"italic"}}>
            "{testimonial}"
            </Text>
        </Card>
    )
}


export default TestimonialsPage;