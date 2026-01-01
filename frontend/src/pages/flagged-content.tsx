import { useLocalStorageState, useRequest } from "@umijs/hooks";
import { fetchGet } from "../api/fetch-utils";
import {
    Anchor,
    Container,
    Divider,
    Flex,
    LoadingOverlay,
    SegmentedControl,
    Table,
    Title,
    Text } from "@mantine/core";
import { Link } from "react-router-dom";
import { FlaggedStatus } from "../interfaces";
import { useMemo } from "react";
import useTitle from "../hooks/useTitle";

const loadFlagged = async () => {
    return (await fetchGet("/api/exam/listflagged/")).value as FlaggedStatus[];
};

interface FlaggedTableUserProps {
  author: string;
  flaggedContent: FlaggedStatus[];
  count: number;
}

const FlaggedTableUser: React.FC<FlaggedTableUserProps> = ({author, flaggedContent, count}) => {
    return (
        <Container mt="sm" key={author}>
            <Flex justify="space-between">
                <Anchor
                    size="xl"
                    c="blue"
                    component={Link}
                    to={`/user/${author}`}
                    target="_blank"
                >
                    {author}
                </Anchor>
                <Text size="xl" fw="bold">Total Flag Count: {count}</Text>
            </Flex>
            <Divider/>
            <Table fz="md">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Link</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Count</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {flaggedContent.map((fs) => (
                        <Table.Tr key={fs.link}>
                            <Table.Td>
                                <Anchor
                                    c="blue"
                                    component={Link}
                                    to={fs.link}
                                    target="_blank"
                                >
                                    {fs.link}
                                </Anchor>
                            </Table.Td>
                            <Table.Td>{fs.flagType ? "Comment" : "Answer"}</Table.Td>
                            <Table.Td>{fs.flaggedCount}</Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </Container>
    );
};

interface FlaggedTableProps {
    flaggedList: FlaggedStatus[];
    typed: boolean; // True if the table includes types false if not
}

const FlaggedTable: React.FC<FlaggedTableProps> = ({flaggedList, typed}) => {
    return (
        <Table fz="md">
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Link</Table.Th>
                    <Table.Th>Author</Table.Th>
                    {typed && <Table.Th>Type</Table.Th>}
                    <Table.Th>Count</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
            {flaggedList && flaggedList.map(content => (
            <Table.Tr key={content.link}>
                <Table.Td>
                    <Anchor
                        c="blue"
                        component={Link}
                        to={content.link}
                        target="_blank"
                    >
                        {content.link}
                    </Anchor>
                </Table.Td>
                <Table.Td>
                    <Anchor
                        c="blue"
                        component={Link}
                        to={`/user/${content.author}`}
                        target="_blank"
                    >
                        {content.author}
                    </Anchor>
                </Table.Td>
                {typed && <Table.Td>{content.flagType ? "Answer" : "Comment"}</Table.Td>}
                <Table.Td>{content.flaggedCount}</Table.Td>
            </Table.Tr>
            ))}
            </Table.Tbody>
        </Table>
    );
};

const FlaggedContent: React.FC = () => {
    const { 
        error: flaggedError,
        loading: flaggedLoading, 
        data: flaggedList,
    } = useRequest(loadFlagged);

    const [mode, setMode] = useLocalStorageState("flaggedMode", "noGrouping");

    const [flaggedListNoGroup, flaggedListByAuthor, flaggedListByType] = useMemo(() => {
        if (!flaggedList) {
            return [undefined, undefined, undefined];
        }
        const flaggedListNoGroup = [...flaggedList].sort((a, b) => b.flaggedCount - a.flaggedCount);
        const byAuthor = new Map<string, [FlaggedStatus[], number]>();
        const byType = {
            comments: [] as FlaggedStatus[],
            answers: [] as FlaggedStatus[],
        }
        flaggedListNoGroup.forEach((fs) => {
            const [list, count] = byAuthor.get(fs.author) ?? [[], 0];
            list.push(fs);
            byAuthor.set(fs.author, [list, count + fs.flaggedCount]);
            fs.flagType ? byType.comments.push(fs) : byType.answers.push(fs);
        });
        return [flaggedListNoGroup, Array.from(byAuthor.entries()),
            byType];
    }, [flaggedList]);

    useTitle("Flagged Content");

    return (
        <Container size="xl">
            <Title order={2} mb="md">
                Flagged Content
            </Title>
            <SegmentedControl
                value={mode}
                onChange={setMode}
                data={[
                    { label: "No Grouping", value: "noGrouping" },
                    { label: "By Type", value: "byType" },
                    { label: "By Author", value: "byAuthor" },
                ]}
            />
            <LoadingOverlay visible={flaggedLoading} />
            {mode === "noGrouping" && flaggedListNoGroup && <FlaggedTable flaggedList={flaggedListNoGroup} typed={true}/>}
            {mode === "byAuthor" && flaggedListByAuthor &&
                flaggedListByAuthor.map(([author, [flaggedContent, count]]) => (
                    <FlaggedTableUser
                        key={author}
                        author={author}
                        flaggedContent={flaggedContent}
                        count={count}
                    />
            ))}
            {mode === "byType" && flaggedListByType &&
            <Container>
                <Title order={2}>Answers</Title>
                <FlaggedTable flaggedList={flaggedListByType.answers} typed={false}/>
                <Title order={2}>Comments</Title>
                <FlaggedTable flaggedList={flaggedListByType.comments} typed={false}/>
            </Container>}
        </Container>
    );
};
export default FlaggedContent;