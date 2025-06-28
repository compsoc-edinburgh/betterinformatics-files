import {
  Card,
  CardProps,
  Button,
  Container,
  TextInput,
  Loader,
  Menu,
  Group,
  Flex,
  Text,
  useComputedColorScheme,
} from "@mantine/core";
import React, { useCallback, useEffect, useState } from "react";
import { useAnswers, useRemoveSplit } from "../api/hooks";
import { useUser } from "../auth";
import useInitialState from "../hooks/useInitialState";
import HideAnswerSectionModal from "../components/hide-answer-section-overlay";
import { AnswerSection } from "../interfaces";
import AnswerComponent from "./answer";
import IconButton from "./icon-button";
import ThreeButtons from "./three-columns";
import { getAnswerSectionId } from "../utils/exam-utils";
import useAlmostInViewport from "../hooks/useAlmostInViewport";
import {
  IconArrowsMoveVertical,
  IconChevronDown,
  IconChevronUp,
  IconDeviceFloppy,
  IconDots,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconTrash,
} from "@tabler/icons-react";
import classes from "./answer-section.module.css";
import { useDisclosure } from "@mantine/hooks";
import ShimmerButton from "./shimmer-button";

interface NameCardProps {
  id: string;
  children: React.ReactNode;
}

const NameCard = (props: NameCardProps) => (
  <Card
    className={classes.nameCard}
    {...props}
    shadow="md"
    id={props.id}
  />
);

const AnswerSectionButtonWrapper = (props: CardProps) => (
  <Card
    p="sm"
    shadow="md"
    mb="1em"
    className={classes.answerSectionButtonWrapper}
    {...props}
  />
);

interface AddButtonProps {
  allowAnswer: boolean;
  hasAnswerDraft: boolean;
  onAnswer: () => void;
}
const AddButton: React.FC<AddButtonProps> = ({
  allowAnswer,
  hasAnswerDraft,
  onAnswer,
}) => {
  if (allowAnswer) {
    return (
      <div>
        {allowAnswer && (
          <ShimmerButton size="sm" onClick={onAnswer} disabled={hasAnswerDraft} color="dark">
            Add Answer
          </ShimmerButton>
        )}
      </div>
    );
  }
};

interface Props {
  oid: string;
  onSectionChange: () => void;
  onToggleHidden: () => void;
  hidden: boolean;
  cutVersion: number;
  setCutVersion: (newVersion: number) => void;
  onHasAnswersChange: () => Promise<void>;
  has_answers: boolean;

  cutName: string;
  onCutNameChange: (newName: string) => void;

  onCancelMove: () => void;
  onMove: () => void;
  isBeingMoved: boolean;

  displayEmptyCutLabels: boolean;
  displayHideShowButtons: boolean;
}

const AnswerSectionComponent: React.FC<Props> = React.memo(
  ({
    oid,
    onSectionChange,
    onToggleHidden,
    hidden,
    cutVersion,
    setCutVersion,

    cutName,
    onCutNameChange,

    onCancelMove,
    onMove,
    isBeingMoved,

    displayEmptyCutLabels,
    displayHideShowButtons,

    onHasAnswersChange,
    has_answers,
  }) => {
    const computedColorScheme = useComputedColorScheme("light");

    const [data, setData] = useState<AnswerSection | undefined>();
    const run = useAnswers(oid, data => {
      setData(data);
      setCutVersion(data.cutVersion);
    });
    const runRemoveSplit = useRemoveSplit(oid, () => {
      if (isBeingMoved) onCancelMove();
      onSectionChange();
    });
    const setAnswerSection = useCallback(
      (newData: AnswerSection) => {
        setCutVersion(newData.cutVersion);
        setData(newData);
        run(); // refreshes the data if there's a new answer
      },
      [setCutVersion, run],
    );

    const [visible, containerElement] = useAlmostInViewport<HTMLDivElement>();

    // initial run to get the answers in a section
    useEffect(() => {
      if ((visible || !hidden) && !data) {
        run();
      }
    }, [run, visible, hidden, data]);

    const [hasDraft, setHasDraft] = useState(false);
    const onAddAnswer = useCallback(() => {
      setHasDraft(true);
      if (hidden) onToggleHidden();
    }, [hidden, onToggleHidden]);
    const user = useUser()!;
    const isCatAdmin = user.isCategoryAdmin;

    const [deleteWarningIsOpen, { open: openDeleteWarning, close: closeDeleteWarning }] = useDisclosure();
    const hideAnswerSection = async () => {
      await onHasAnswersChange();
      closeDeleteWarning();
      run(); // updates data when setting visibility to hidden
    };
    const hideAnswerSectionWithWarning = () => {
      if (data) {
        if (data.answers.length === 0 || !has_answers) {
          hideAnswerSection();
        } else {
          openDeleteWarning();
        }
      }
    };

    const [draftName, setDraftName] = useInitialState(cutName);
    const [isEditingName, setIsEditingName] = useState(
      data && cutName.length === 0 && isCatAdmin,
    );
    useEffect(() => {
      if (data && cutName.length === 0 && isCatAdmin) setIsEditingName(true);
    }, [data, isCatAdmin, cutName]);
    const id = getAnswerSectionId(oid, cutName);

    return (
      <div ref={containerElement}>
        <HideAnswerSectionModal
          isOpen={deleteWarningIsOpen}
          onClose={closeDeleteWarning}
          setHidden={hideAnswerSection}
        />
        {((cutName && cutName.length > 0) ||
          (isCatAdmin && displayEmptyCutLabels)) && (
            <NameCard id={id}>
              {isEditingName ? (
                <Group>
                  <TextInput
                    value={draftName}
                    placeholder="Name"
                    onChange={e => setDraftName(e.target.value)}
                  />
                  <IconButton
                    variant="filled"
                    tooltip="Save PDF section name"
                    icon={<IconDeviceFloppy />}
                    onClick={() => {
                      setIsEditingName(false);
                      onCutNameChange(draftName);
                    }}
                  />
                </Group>
              ) : (
                <Flex justify="space-between" align="center">
                  <Text fw={700} m={0}>
                    {cutName}
                  </Text>
                  {isCatAdmin && (
                    <IconButton
                      variant="filled"
                      tooltip="Edit PDF section name"
                      icon={<IconEdit />}
                      onClick={() => setIsEditingName(true)}
                    />
                  )}
                </Flex>
              )}
            </NameCard>
          )}
        <Container fluid pb="md" px="md">
          {/* Show answer background only if not hidden, and either answers
          exist or there is a draft. Careful with the conditionals here because
          if you start a draft on a collapsed question with no answers, and then
          delete the draft, you'll end up with a 'expanded but no answers or
          drafts' state. */}
          {!hidden && data && (data.answers.length > 0 || hasDraft) && (
            <Card
              bg={computedColorScheme === "light" ? "gray.0" : "dark.7"}
              shadow="md"
              px="xs"
              py="xs"
              radius={0}
            >
              {data.answers.map(answer => (
                <AnswerComponent
                  key={answer.oid}
                  section={data}
                  answer={answer}
                  onSectionChanged={setAnswerSection}
                />
              ))}
              {hasDraft && (
                <AnswerComponent
                  section={data}
                  onSectionChanged={setAnswerSection}
                  onDelete={() => setHasDraft(false)}
                />
              )}
            </Card>
          )}
          <AnswerSectionButtonWrapper
            bg={computedColorScheme === "light" ? "gray.0" : "dark.7"}
          // color={isBeingMoved || !has_answers ? "primary" : undefined}
          >
            <div>
              {data === undefined ? (
                <ThreeButtons center={<Loader />} />
              ) : (
                <>
                  <ThreeButtons
                    left={
                      <>
                        {displayHideShowButtons ? (
                          <IconButton
                            size="sm"
                            icon={has_answers ? <IconEyeOff /> : <IconEye />}
                            tooltip="Toggle visibility"
                            onClick={hideAnswerSectionWithWarning}
                          />
                        ) : null}

                        {isBeingMoved ? (
                          <Button size="sm" onClick={onCancelMove} color="red" variant="outline">
                            Cancel Move
                          </Button>
                        ) : (
                          (data.answers.length === 0 || !hidden) &&
                          has_answers &&
                          data &&
                          data.allow_new_answer && (
                            <AddButton
                              allowAnswer={data.allow_new_answer}
                              hasAnswerDraft={hasDraft}
                              onAnswer={onAddAnswer}
                            />
                          )
                        )}
                      </>
                    }
                    center={
                      !isBeingMoved &&
                      data.answers.length > 0 && (
                        <>
                          <Button onClick={onToggleHidden} variant={hidden ? "filled" : "outline"} leftSection={hidden ? <IconChevronDown /> : <IconChevronUp />}>
                            {hidden ? "Show Answers" : "Hide Answers"}
                          </Button>
                        </>
                      )
                    }
                    right={
                      isCatAdmin && (
                        <Menu withinPortal>
                          <Menu.Target>
                            <Button rightSection={<IconChevronDown />} color="dark">
                              <IconDots />
                            </Button>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconTrash />}
                              onClick={runRemoveSplit}
                            >
                              Delete
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconArrowsMoveVertical />}
                              onClick={onMove}
                            >
                              Move
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      )
                    }
                  />
                </>
              )}
            </div>
          </AnswerSectionButtonWrapper>
        </Container>
      </div>
    );
  },
);

export default AnswerSectionComponent;
