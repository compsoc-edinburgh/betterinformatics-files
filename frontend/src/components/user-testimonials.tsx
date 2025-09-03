
import { useUser } from "../auth";
import { Modal, Alert, Space, Textarea, Card, Text, Box, Tooltip, Group, Flex, Button, Stack} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import {
    loadTestimonials
  } from "../api/testimonials";
import { CourseTestimonial, ApprovalStatus, Course, CourseWithTestimonial, getTableData } from "../pages/testimonials-page"
import { useRequest } from "@umijs/hooks";
import { useDisclosure } from '@mantine/hooks';
import {useState } from 'react';
import { fetchPost, fetchGet } from '../api/fetch-utils';
import { useForm } from '@mantine/form';

interface UserTestimonialsProps {
    username: string;
}   

interface TestimonialsProps{
    currentUserId: string,
    isAdmin: boolean,
    testimonials: CourseTestimonial[]
}

const Testimonials: React.FC<TestimonialsProps> = ({currentUserId, isAdmin, testimonials}) => {
    return (
    <>
    <Stack>
        {isAdmin? testimonials.filter((testimonial) => testimonial.approval_status == ApprovalStatus.PENDING).map((testimonial, index)  => 
            <AdminTestimonialCard key={index} username={String(testimonial.authorId)} displayName={String(testimonial.authorDisplayName)} course_code={testimonial.course_code} course_name={testimonial.course_name} yearTaken={String(testimonial.year_taken)} testimonial={String(testimonial.testimonial)}></AdminTestimonialCard>
        ) : testimonials.filter((testimonial) => testimonial.authorId=currentUserId).map((testimonial, index)  => 
        <UserTestimonialCard key={index} username={String(testimonial.authorId)} displayName={String(testimonial.authorDisplayName)} course_code={testimonial.course_code} course_name={testimonial.course_name} yearTaken={String(testimonial.year_taken)} testimonial={String(testimonial.testimonial)} testimonial_approval_status={testimonial.approval_status}></UserTestimonialCard>
        )}
    </Stack>
    </>);
}


interface AdminTestimonialCardProps{
    username: String, displayName: String, course_code: String, course_name:String, yearTaken: String, testimonial:String
  }


  interface UserTestimonialCardProps{
    username: String, displayName: String, course_code: String, course_name:String, yearTaken: String, testimonial:String, testimonial_approval_status:Number
  }
  
const UserTestimonialCard: React.FC<UserTestimonialCardProps> = ({course_code, course_name, username, displayName, yearTaken, testimonial, testimonial_approval_status}) => {

    return(
        <>
            <Card withBorder={true} radius="md" p={"lg"}>
            <Flex gap={3} justify='flex-end'>
                    <Text style={{
                        backgroundColor: testimonial_approval_status==ApprovalStatus.APPROVED ? "teal" : testimonial_approval_status==ApprovalStatus.REJECTED ? "red" : "orange",
                        color: "white",
                        borderRadius: "8px",
                        padding: "8px",
                        display: "inline-block",
                    }}>{testimonial_approval_status==ApprovalStatus.APPROVED ? "Approved" : testimonial_approval_status==ApprovalStatus.REJECTED ? "Rejected" : "Pending"}</Text>
            </Flex> 
            <Flex flex='1' gap='4' align='center' wrap={'wrap'}>
                    <Text component="span" >
                        <strong>Course:</strong> {course_code} - {course_name}
                    </Text>
            </Flex>
            <Stack style={{
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
                    </Text>
                    <Text ml="0.3em" color="dimmed" component="span">
                    @{username}
                    </Text>
                    <Text color="dimmed" mx={6} component="span">
                    ·
                    </Text>
                    <Text color="dimmed">took the course in {yearTaken}</Text>
                </Flex>
                
                    </Flex>
                    <Text style={{"fontStyle":"italic"}}>
                    "{testimonial}"
                    </Text>
                </Stack>
                
            </Card>
        </>
        )
}
  
const AdminTestimonialCard: React.FC<AdminTestimonialCardProps> = ({course_code, course_name, username, displayName, yearTaken, testimonial}) => {
    const [opened, { open, close }] = useDisclosure(false);
    const [success, setSuccess] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    //useForm?

    const form = useForm({
        initialValues: {
          message: '',
        },
    
        validate: {
          message: (value: string) => (value ? null : 'Message is required.'),
        },
      });

    const disapproveTestimonial = async (values: typeof form.values) => {
        setSuccess(null);
        setErrorMessage(null);

        const dataToSend = {
            author: username,
            course_code: course_code,
            title: "Testimonial not Approved",
            message: values.message,
            approval_status: ApprovalStatus.REJECTED
        };
        try {
        console.log(dataToSend)
        const response = await fetchPost('/api/testimonials/updatetestimonialapproval/', dataToSend);
        console.log("Response Disapprove Testimonial")
        console.log(response.value)

        if (response.value) {
            setSuccess(true);
            setTimeout(() => (window.location.reload()),1000);
        } else {
            setSuccess(false);
            setErrorMessage(response.error || 'Unknown error during deletion.');
        }
        } catch (error: any) {
        setSuccess(false);
        setErrorMessage(error || 'Network error during deletion.');
        }
    }

    const approveTestimonial = async () => {
        setSuccess(null);
        setErrorMessage(null);

        const dataToSend = {
            author: username,
            course_code: course_code,
            title: "Testimonial Approved",
            message: "Your testimonial has been approved.",
            approval_status: ApprovalStatus.APPROVED
        };
        try {
        console.log(dataToSend)
        const response = await fetchPost('/api/testimonials/updatetestimonialapproval/', dataToSend);
        console.log("Response Approve Testimonial")
        console.log(response.value)

        if (response.value) {
            setSuccess(true);
            setTimeout(() => (window.location.reload()),1000);
        } else {
            setSuccess(false);
            setErrorMessage(response.error || 'Unknown error during deletion.');
        }
        } catch (error: any) {
        setSuccess(false);
        setErrorMessage(error || 'Network error during deletion.');
        }
    }

    return(
        <>
            <Modal opened={opened} onClose={close} title="Disapprove Testimonial" centered>
                <Stack>
                <Text>Are you sure you'd like to disapprove this testimonial? This action cannot be undone.</Text>
                <Text>Disapproving a testimonial will send a notification to the user, with the reason input behind why it has been disapproved.</Text>
                
                <form onSubmit={form.onSubmit(disapproveTestimonial)}>
                    <Textarea size={"md"} placeholder = "feedback.." {...form.getInputProps('message')}></Textarea> 

                {success === true && (
                    <Alert color="green">Successfully disapproved testimonial, refreshing page now...</Alert>
                )}

                {success === false && errorMessage && (
                    <Alert color="red">Failed to disapprove testimonial due to {errorMessage}</Alert>
                )}

                <Flex gap={3} justify="flex-end">
                    <Button type="submit" variant="filled" color="red">Confirm</Button>
                    <Button variant="default" onClick={close}>Cancel</Button>
                </Flex>
                </form>
                </Stack>
            
            </Modal>

            <Card withBorder={true} radius="md" p={"lg"}>
            <Flex flex='1' gap='4' align='center' wrap={'wrap'}>
                    <Text component="span" >
                        <strong>Course:</strong> {course_code} - {course_name}
                    </Text>
            </Flex>
            <Stack style={{
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
                    </Text>
                    <Text ml="0.3em" color="dimmed" component="span">
                    @{username}
                    </Text>
                    <Text color="dimmed" mx={6} component="span">
                    ·
                    </Text>
                    <Text color="dimmed">took the course in {yearTaken}</Text>
                </Flex>
                
                    </Flex>
                    <Text style={{"fontStyle":"italic"}}>
                    "{testimonial}"
                    </Text>
                </Stack>
                <Space h="xs"/>
                <Flex gap={3} justify='flex-end'>
                    <Button color="red" onClick={ () => {
                        open()
                        }
                    }>
                        Disapprove
                    </Button>
                    <Button color="teal" onClick={approveTestimonial}>
                        Approve
                    </Button>
                </Flex>
                 
            </Card>
        </>
        )
}

const UserTestimonials: React.FC<UserTestimonialsProps> = ({ username }) => {

    const { data : testimonials, loading: loading_testimonials, error: error_testimonials } = useRequest(
        () => loadTestimonials()
    );

    const { username: currentUsername, isAdmin } = useUser()!;

    const isOwnProfile = username === currentUsername;

    return (
    <>
    {isOwnProfile && (
        <Box mb="md">
          <Alert color="blue" title={
            <Group>
              <Tooltip
                label="Your testimonials are visible to you and admins on this page."
                multiline
                maw={300}
                withArrow
                withinPortal
              >
                <IconInfoCircle size={16} style={{ cursor: 'pointer' }} />
              </Tooltip>
              <Text>Your Testimonials</Text>
            </Group>
          }>
            {isAdmin ?
              "As an admin, you can see all testimonials and flag testimonials that are toxic or contain names." :
              "This page shows all your testimonials, including those under review."}
          </Alert>
        </Box>
      )}
      {(testimonials && <Testimonials testimonials={testimonials["value"]} isAdmin={isAdmin} currentUserId={currentUsername}/>)||
              ((loading_testimonials || error_testimonials) && <Testimonials testimonials={[]} isAdmin={isAdmin} currentUserId={currentUsername}/>)
      }
    </>);
}

export default UserTestimonials;