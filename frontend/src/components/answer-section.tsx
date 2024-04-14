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
  IconDeviceFloppy,
  IconDots,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconTrash,
} from "@tabler/icons-react";
import classes from "./answer-section.module.css";

interface NameCardProps {
  id: string;
  children: React.ReactNode;
}

const NameCard = (props: NameCardProps) => (
  <Card
    bg="gray.1"
    withBorder
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
    withBorder
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
          <Button size="sm" onClick={onAnswer} disabled={hasAnswerDraft} color="dark">
            Add Answer
          </Button>
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

    const [deleteAnswersWarning, setDeleteAnswersWarning] = useState(false);
    const hideAnswerSection = async () => {
      await onHasAnswersChange();
      setDeleteAnswersWarning(false);
      run(); // updates data when setting visibility to hidden
    };
    const hideAnswerSectionWithWarning = () => {
      if (data) {
        if (data.answers.length === 0 || !has_answers) {
          hideAnswerSection();
        } else {
          setDeleteAnswersWarning(true);
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
          isOpen={deleteAnswersWarning}
          toggle={() => setDeleteAnswersWarning(false)}
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
          {!hidden && data && (
            <div>
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
            </div>
          )}
          <AnswerSectionButtonWrapper
            bg="gray.0"
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
                          <Button size="sm" onClick={onCancelMove}>
                            Cancel
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
                          <Button onClick={onToggleHidden}>
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
