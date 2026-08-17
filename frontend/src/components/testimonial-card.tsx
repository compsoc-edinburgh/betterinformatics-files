import { Card, Text, Flex, Stack} from "@mantine/core";
import { ApprovalStatus, Testimonial } from "../interfaces";
import classes from "./testimonial-card.module.css";

export const TestimonialCard: React.FC<Testimonial> = ({author_id, author_display_name, slug, testimonial, year_taken, approval_status}) => {
    const statusClass =
        approval_status === ApprovalStatus.APPROVED
            ? classes.approved
            : approval_status === ApprovalStatus.REJECTED
            ? classes.rejected
            : classes.pending;
    return(
       
        <Card withBorder radius="md" p="lg">
            <Flex gap="md" justify="flex-end">
                <Text className={`${classes.statusBadge} ${statusClass}`}>
                    {approval_status === ApprovalStatus.APPROVED
                        ? "Approved"
                        : approval_status === ApprovalStatus.REJECTED
                        ? "Rejected"
                        : "Pending"}
                </Text>
            </Flex>

            <Flex gap="md" align="center" wrap="wrap">
                <Text span>
                    <strong>Course:</strong> {slug}
                </Text>
            </Flex>

            <Stack
               className={classes.testimonial}
            >
                <Flex gap="md">
                    <Flex flex={1} gap="md" align="center" wrap="wrap">
                        <Text fw={700} span>
                            {author_display_name}
                        </Text>

                        <Text ml="0.3em" c="dimmed" span>
                            @{author_id}
                        </Text>

                        <Text c="dimmed" mx={6} span>
                            ·
                        </Text>

                        <Text c="dimmed">
                            took the course in {String(year_taken)}
                        </Text>
                    </Flex>
                </Flex>

                <Text fs="italic">
                    "{testimonial}"
                </Text>
            </Stack>
        </Card>
        )
}