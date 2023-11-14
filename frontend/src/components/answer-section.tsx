import { css } from "@emotion/css";
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
  MediaQuery,
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
import { Icon, ICONS } from "vseth-canine-ui";

const nameCardStyle = css`
  border-top-left-radius: 0;
  border-top-right-radius: 0;
`;

interface NameCardProps {
  id: string;
  children: React.ReactNode;
}

const NameCard = (props: NameCardProps) => (
  <Card
    bg="gray.1"
    className={nameCardStyle}
    {...props}
    shadow="md"
    id={props.id}
  />
);

const answerSectionButtonWrapperStyle = css`
  margin-top: 1em;
  margin-bottom: 1em;
`;
const AnswerSectionButtonWrapper = (props: CardProps) => (
  <Card
    p="sm"
    shadow="md"
    withBorder
    className={answerSectionButtonWrapperStyle}
    {...props}
  />
);

interface AddButtonProps {
  allowAnswer: boolean;
  allowLegacyAnswer: boolean;
  hasAnswerDraft: boolean;
  hasLegacyAnswerDraft: boolean;
  onAnswer: () => void;
  onLegacyAnswer: () => void;
}
const AddButton: React.FC<AddButtonProps> = ({
  allowAnswer,
  allowLegacyAnswer,
  hasAnswerDraft,
  hasLegacyAnswerDraft,
  onAnswer,
  onLegacyAnswer,
}) => {
  const [isOpen, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen(old => !old), []);
  if (allowAnswer && allowLegacyAnswer) {
    return (
      <Menu opened={isOpen} withinPortal onChange={toggle}>
        <Menu.Target>
          <Button rightIcon={<Icon icon={ICONS.DOWN} />}>Add Answer</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={onAnswer} disabled={hasAnswerDraft}>
            Add Answer
          </Menu.Item>
          <Menu.Item onClick={onLegacyAnswer} disabled={hasLegacyAnswerDraft}>
            Add Legacy Answer
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  } else {
    return (
      <div>
        {allowAnswer && (
          <Button size="sm" onClick={onAnswer} disabled={hasAnswerDraft}>
            Add Answer
          </Button>
        )}
        {allowLegacyAnswer && (
          <Button
            size="sm"
            onClick={onLegacyAnswer}
            disabled={hasLegacyAnswerDraft}
          >
            Add Legacy Answer
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
    // initial run to get the answers in a section
    useEffect(() => {
      run();
    }, [run]);
    const [hasDraft, setHasDraft] = useState(false);
    const [hasLegacyDraft, setHasLegacyDraft] = useState(false);
    const onAddAnswer = useCallback(() => {
      setHasDraft(true);
      if (hidden) onToggleHidden();
    }, [hidden, onToggleHidden]);
    const onAddLegacyAnswer = useCallback(() => {
      setHasLegacyDraft(true);
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
      <>
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
                  tooltip="Save PDF section name"
                  iconName={ICONS.SAVE}
                  onClick={() => {
                    setIsEditingName(false);
                    onCutNameChange(draftName);
                  }}
                />
              </Group>
            ) : (
              <Flex justify="space-between">
                <Text component="h6" m={0}>
                  {cutName}
                </Text>
                {isCatAdmin && (
                  <IconButton
                    tooltip="Edit PDF section name"
                    size="sm"
                    iconName={ICONS.EDIT}
                    onClick={() => setIsEditingName(true)}
                  />
                )}
              </Flex>
            )}
          </NameCard>
        )}
        <Container fluid py="md" px="md">
          {!hidden && data && (
            <div>
              {data.answers.map(answer => (
                <AnswerComponent
                  key={answer.oid}
                  section={data}
                  answer={answer}
                  onSectionChanged={setAnswerSection}
                  isLegacyAnswer={answer.isLegacyAnswer}
                />
              ))}
              {hasDraft && (
                <AnswerComponent
                  section={data}
                  onSectionChanged={setAnswerSection}
                  onDelete={() => setHasDraft(false)}
                  isLegacyAnswer={false}
                />
              )}
              {hasLegacyDraft && (
                <AnswerComponent
                  section={data}
                  onSectionChanged={setAnswerSection}
                  onDelete={() => setHasLegacyDraft(false)}
                  isLegacyAnswer={true}
                />
              )}
            </div>
          )}
          <AnswerSectionButtonWrapper
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
                            iconName={has_answers ? ICONS.VIEW_OFF : ICONS.VIEW}
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
                          (data.allow_new_answer ||
                            (data.allow_new_legacy_answer && isCatAdmin)) && (
                            <AddButton
                              allowAnswer={data.allow_new_answer}
                              allowLegacyAnswer={
                                data.allow_new_legacy_answer && isCatAdmin
                              }
                              hasAnswerDraft={hasDraft}
                              hasLegacyAnswerDraft={hasLegacyDraft}
                              onAnswer={onAddAnswer}
                              onLegacyAnswer={onAddLegacyAnswer}
                            />
                          )
                        )}
                      </>
                    }
                    center={
                      !isBeingMoved &&
                      data.answers.length > 0 && (
                        <>
                          <MediaQuery
                            smallerThan="sm"
                            styles={{ display: "none" }}
                          >
                            <Button
                              color="primary"
                              onClick={onToggleHidden}
                              className="d-inline-block"
                            >
                              {hidden ? "Show Answers" : "Hide Answers"}
                            </Button>
                          </MediaQuery>
                          <MediaQuery
                            largerThan="sm"
                            styles={{ display: "none" }}
                          >
                            <Button
                              color="primary"
                              size="xs"
                              onClick={onToggleHidden}
                              className="d-inline-block"
                            >
                              {hidden ? "Show Answers" : "Hide Answers"}
                            </Button>
                          </MediaQuery>
                        </>
                      )
                    }
                    right={
                      isCatAdmin && (
                        <Menu withinPortal>
                          <Menu.Target>
                            <Button rightIcon={<Icon icon={ICONS.DOWN} />}>
                              <Icon icon={ICONS.DOTS_H} size={18} />
                            </Button>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item onClick={runRemoveSplit}>
                              Delete
                            </Menu.Item>
                            <Menu.Item onClick={onMove}>Move</Menu.Item>
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
      </>
    );
  },
);

export default AnswerSectionComponent;
