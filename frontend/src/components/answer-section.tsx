import { css } from "@emotion/css";
import {
  ButtonDropdown,
  Card,
  CardFooter,
  CardHeader,
  CardProps,
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Input,
  InputGroup,
  InputGroupButtonDropdown,
  Row,
  UncontrolledDropdown,
} from "@vseth/components";
import { Loader, Button, Container } from "@mantine/core";
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

const NameCard = (props: CardProps) => (
  <Card className={nameCardStyle} {...props} />
);

const answerSectionButtonWrapperStyle = css`
  margin-top: 1em;
  margin-bottom: 1em;
`;
const AnswerSectionButtonWrapper = (props: CardProps) => (
  <Card className={answerSectionButtonWrapperStyle} {...props} />
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
      <ButtonDropdown isOpen={isOpen} toggle={toggle} className="text-left">
        <DropdownToggle size="sm" caret>
          Add Answer
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={onAnswer} disabled={hasAnswerDraft}>
            Add Answer
          </DropdownItem>
          <DropdownItem
            onClick={onLegacyAnswer}
            disabled={hasLegacyAnswerDraft}
          >
            Add Legacy Answer
          </DropdownItem>
        </DropdownMenu>
      </ButtonDropdown>
    );
  } else {
    return (
      <Button.Group className="text-left">
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
      </Button.Group>
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
              <CardFooter>
                {isEditingName ? (
                  <InputGroup size="sm">
                    <Input
                      type="text"
                      value={draftName}
                      placeholder="Name"
                      onChange={e => setDraftName(e.target.value)}
                    />
                    <InputGroupButtonDropdown addonType="append">
                      <IconButton
                        tooltip="Save PDF section name"
                        iconName={ICONS.SAVE}
                        onClick={() => {
                          setIsEditingName(false);
                          onCutNameChange(draftName);
                        }}
                      />
                    </InputGroupButtonDropdown>
                  </InputGroup>
                ) : (
                  <Row>
                    <Col className="d-flex flex-center flex-column">
                      <h6 className="m-0">{cutName}</h6>
                    </Col>
                    <Col xs="auto">
                      {isCatAdmin && (
                        <IconButton
                          tooltip="Edit PDF section name"
                          size="sm"
                          iconName={ICONS.EDIT}
                          onClick={() => setIsEditingName(true)}
                        />
                      )}
                    </Col>
                  </Row>
                )}
              </CardFooter>
            </NameCard>
          )}
        <Container fluid>
          {!hidden && data && (
            <>
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
            </>
          )}
          <AnswerSectionButtonWrapper
            color={isBeingMoved || !has_answers ? "primary" : undefined}
          >
            <CardHeader>
              <div className="d-flex">
                {data === undefined ? (
                  <ThreeButtons center={<Loader />} />
                ) : (
                  <>
                    <ThreeButtons
                      left={
                        <>
                          {displayHideShowButtons ? (
                            <IconButton
                              className="mr-1"
                              size="sm"
                              iconName={
                                has_answers ? ICONS.VIEW_OFF : ICONS.VIEW
                              }
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
                          <Button
                            color="primary"
                            size="sm"
                            onClick={onToggleHidden}
                            className="d-inline-block"
                          >
                            {hidden ? "Show Answers" : "Hide Answers"}
                          </Button>
                        )
                      }
                      right={
                        isCatAdmin && (
                          <UncontrolledDropdown>
                            <DropdownToggle caret size="sm">
                              <Icon icon={ICONS.DOTS_H} size={18} />
                            </DropdownToggle>
                            <DropdownMenu>
                              <DropdownItem onClick={runRemoveSplit}>
                                Delete
                              </DropdownItem>
                              <DropdownItem onClick={onMove}>Move</DropdownItem>
                            </DropdownMenu>
                          </UncontrolledDropdown>
                        )
                      }
                    />
                  </>
                )}
              </div>
            </CardHeader>
          </AnswerSectionButtonWrapper>
        </Container>
      </>
    );
  },
);

export default AnswerSectionComponent;
