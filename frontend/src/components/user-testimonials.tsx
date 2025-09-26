
import { useUser } from "../auth";
import { Modal, LoadingOverlay, SegmentedControl, Alert, Space, Textarea, Card, Text, Box, Tooltip, Group, Flex, Button, Stack} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import {
    loadTestimonials
  } from "../api/testimonials";
import { CourseTestimonial, ApprovalStatus, Course, CourseWithTestimonial, getTableData } from "../pages/testimonials-page"
import { useRequest } from "@umijs/hooks";
import { useDisclosure } from '@mantine/hooks';
import { useState,useEffect } from 'react';
import { fetchPost, fetchGet } from '../api/fetch-utils';
import { useForm } from '@mantine/form';

interface UserTestimonialsProps {
    username: string;
}   

interface TestimonialsProps{
    currentUserId: string,
    isAdmin: boolean,
}

const Testimonials: React.FC<TestimonialsProps> = ({currentUserId, isAdmin}) => {
    const { data : testimonials, loading: loading_testimonials, error: error_testimonials, refresh } = useRequest(
        () => loadTestimonials()
    );
    const [updatedTestimonials, setUpdatedTestimonials] = useState<CourseTestimonial[]>([]);
    const [loadingTestimonials, setLoadingTestimonials] = useState<boolean | undefined>(true);
    const [errorTestimonials, setErrorTestimonials] = useState<Boolean>(false);
    const [approvalStatusFilter, setApprovalStatusFilter] = useState("All");

    useEffect(() => {
        if (testimonials) {
            setUpdatedTestimonials(testimonials['value']);
            setLoadingTestimonials(loading_testimonials);
            if (error_testimonials){
                setErrorTestimonials(true);
            }
        }
    }, [testimonials]);

    const AdminTestimonialCard: React.FC<AdminTestimonialCardProps> = ({category_id, course_name, username, displayName, yearTaken, testimonial, testimonial_id, testimonial_approval_status}) => {
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
            
            setLoadingTestimonials(true);
            setSuccess(null);
            setErrorMessage(null);
    
            const dataToSend = {
                author: username,
                category_id: category_id,
                testimonial_id: testimonial_id,
                course_name: course_name,
                title: "Testimonial not Approved",
                message: values.message,
                approval_status: ApprovalStatus.REJECTED
            };
            try {
    
            const response = await fetchPost('/api/testimonials/updatetestimonialapproval/', dataToSend);
    
            if (response.value) {
                setSuccess(true);
                refresh();
                setLoadingTestimonials(false);
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
            setLoadingTestimonials(true);
            setSuccess(null);
            setErrorMessage(null);
    
            const dataToSend = {
                author: username,
                category_id: category_id,
                testimonial_id: testimonial_id,
                title: "Testimonial Approved",
                message: "Your testimonial has been approved.",
                approval_status: ApprovalStatus.APPROVED,
                course_name: course_name
            };
            try {
            const response = await fetchPost('/api/testimonials/updatetestimonialapproval/', dataToSend);
    
            if (response.value) {
                setSuccess(true);
                refresh();
                setLoadingTestimonials(false);
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
                    <Text>When you disapprove a testimonial, the user will be notified. Please provide feedback below so they know what to improve.</Text>
                    
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
                            <strong>Course:</strong> {course_name}
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

    let approvalStatusMap = new Map<string, number>([
        ["Approved", ApprovalStatus.APPROVED],
        ["Pending", ApprovalStatus.PENDING],
        ["Rejected", ApprovalStatus.REJECTED]
    ]);


    return (
    <>
    <Stack>
        <Stack align="flex-end">
            <SegmentedControl data={["All", 'Approved', 'Pending', 'Rejected']} value={approvalStatusFilter} onChange={setApprovalStatusFilter}/>
        </Stack>
        <LoadingOverlay visible={loadingTestimonials}></LoadingOverlay>
        {errorTestimonials? <Text>There has been an error with loading the testimonials.</Text> : 
            updatedTestimonials && 
            (isAdmin? 
                (approvalStatusFilter== "All"? updatedTestimonials.map((testimonial, index)  => 
                <AdminTestimonialCard key={index} username={String(testimonial.author_id)} displayName={String(testimonial.author_diplay_name)} category_id={testimonial.category_id} course_name={testimonial.course_name} yearTaken={String(testimonial.year_taken)} testimonial={String(testimonial.testimonial)} testimonial_id={String(testimonial.testimonial_id)} testimonial_approval_status={testimonial.approval_status}></AdminTestimonialCard>
                ) : updatedTestimonials.filter((testimonial) => testimonial.approval_status === approvalStatusMap.get(approvalStatusFilter)).map((testimonial, index)  => 
                <AdminTestimonialCard key={index} username={String(testimonial.author_id)} displayName={String(testimonial.author_diplay_name)} category_id={testimonial.category_id} course_name={testimonial.course_name} yearTaken={String(testimonial.year_taken)} testimonial={String(testimonial.testimonial)} testimonial_id={String(testimonial.testimonial_id)} testimonial_approval_status={testimonial.approval_status}></AdminTestimonialCard>
                )): 
                (approvalStatusFilter== "All"? updatedTestimonials.filter((testimonial) => testimonial.author_id===currentUserId).map((testimonial, index)  => 
                <UserTestimonialCard key={index} username={String(testimonial.author_id)} displayName={String(testimonial.author_diplay_name)} category_id={testimonial.category_id} course_name={testimonial.course_name} yearTaken={String(testimonial.year_taken)} testimonial={String(testimonial.testimonial)} testimonial_approval_status={testimonial.approval_status}></UserTestimonialCard>
                ) : updatedTestimonials.filter((testimonial) => testimonial.author_id===currentUserId && testimonial.approval_status===approvalStatusMap.get(approvalStatusFilter)).map((testimonial, index)  => 
                <UserTestimonialCard key={index} username={String(testimonial.author_id)} displayName={String(testimonial.author_diplay_name)} category_id={testimonial.category_id} course_name={testimonial.course_name} yearTaken={String(testimonial.year_taken)} testimonial={String(testimonial.testimonial)} testimonial_approval_status={testimonial.approval_status}></UserTestimonialCard>
                ))
            )
        }
    </Stack>
    </>);
}


interface AdminTestimonialCardProps{
    username: String, displayName: String, category_id: String, course_name:String, yearTaken: String, testimonial:String, testimonial_id:String, testimonial_approval_status:Number
  }


  interface UserTestimonialCardProps{
    username: String, displayName: String, category_id: String, course_name:String, yearTaken: String, testimonial:String, testimonial_approval_status:Number
  }
  
const UserTestimonialCard: React.FC<UserTestimonialCardProps> = ({category_id, course_name, username, displayName, yearTaken, testimonial, testimonial_approval_status}) => {

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
                        <strong>Course:</strong> {course_name}
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

const UserTestimonials: React.FC<UserTestimonialsProps> = ({ username }) => {

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
       <Testimonials isAdmin={isAdmin} currentUserId={currentUsername}/>
    </>);
}

export default UserTestimonials;