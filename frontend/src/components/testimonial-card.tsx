import { Modal, LoadingOverlay, SegmentedControl, Alert, Space, Textarea, Card, Text, Box, Tooltip, Group, Flex, Button, Stack} from "@mantine/core";

export interface TestimonialCardProps{
    author_id: String, author_diplay_name: String, slug: String, testimonial:String, yearTaken: Number, approval_status:Number
  }
  export enum ApprovalStatus {
    APPROVED = 0,
    PENDING = 1,
    REJECTED = 2,
  }
export const TestimonialCard: React.FC<TestimonialCardProps> = ({author_id, author_diplay_name, slug, testimonial, yearTaken, approval_status}) => {
    return(
        <>
            <Card withBorder={true} radius="md" p={"lg"}>
            <Flex gap={3} justify='flex-end'>
                    <Text style={{
                        backgroundColor: approval_status==ApprovalStatus.APPROVED ? "teal" : approval_status==ApprovalStatus.REJECTED ? "red" : "orange",
                        color: "white",
                        borderRadius: "8px",
                        padding: "8px",
                        display: "inline-block",
                    }}>{approval_status==ApprovalStatus.APPROVED ? "Approved" : approval_status==ApprovalStatus.REJECTED ? "Rejected" : "Pending"}</Text>
            </Flex> 
            <Flex flex='1' gap='4' align='center' wrap={'wrap'}>
                    <Text component="span" >
                        <strong>Course:</strong> {slug}
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
                    {author_id}
                    </Text>
                    <Text ml="0.3em" color="dimmed" component="span">
                    @{author_diplay_name}
                    </Text>
                    <Text color="dimmed" mx={6} component="span">
                    ·
                    </Text>
                    <Text color="dimmed">took the course in {String(yearTaken)}</Text>
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