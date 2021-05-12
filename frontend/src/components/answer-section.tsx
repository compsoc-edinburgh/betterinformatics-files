import {
  Button,
  ButtonDropdown,
  ButtonGroup,
  Card,
  CardFooter,
  CardHeader,
  Container,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Icon,
  ICONS,
  Input,
  InputGroup,
  InputGroupButtonDropdown,
  Spinner,
  UncontrolledDropdown,
  Col,
  Row,
  CardProps,
} from "@vseth/components";
import { css } from "@emotion/css";
import React, { useCallback, useEffect, useState } from "react";
import { useAnswers, useRemoveSplit } from "../api/hooks";
import { useUser } from "../auth";
import useInitialState from "../hooks/useInitialState";
import HideAnswersModal from "../components/hide-answers-overlay";
import useLoad from "../hooks/useLoad";
import { AnswerSection } from "../interfaces";
import AnswerComponent from "./answer";
import IconButton from "./icon-button";
import ThreeButtons from "./three-columns";

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
  const toggle = useCallback(() => setOpen((old) => !old), []);
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
      <ButtonGroup className="text-left">
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
      </ButtonGroup>
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
  onHasAnswersChange: () => void;
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
    const run = useAnswers(oid, (data) => {
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
      },
      [setCutVersion],
    );
    const [inViewport, ref] = useLoad<HTMLDivElement>();
    const visible = inViewport || false;
    useEffect(() => {
      if (
        (data === undefined || data.cutVersion !== cutVersion) &&
        (visible || !hidden)
      ) {
        run();
      }
    }, [data, visible, run, cutVersion, hidden, has_answers]);
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

    const [draftName, setDraftName] = useInitialState(cutName);
    const [isEditingName, setIsEditingName] = useState(
      data && cutName.length === 0 && isCatAdmin,
    );
    useEffect(() => {
      if (data && cutName.length === 0 && isCatAdmin) setIsEditingName(true);
    }, [data, isCatAdmin, cutName]);
    const nameParts = cutName.split(" > ");
    const id = `${oid}-${nameParts.join("-")}`;

    return (
      <>
        <HideAnswersModal
          isOpen={deleteAnswersWarning}
          toggle={() => setDeleteAnswersWarning(false)}
          setHidden={() => {
            onHasAnswersChange();
            setDeleteAnswersWarning(false);
            if(data) {
              data.answers = [];
              setAnswerSection(data);
            }
          }}
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
                      onChange={(e) => setDraftName(e.target.value)}
                    />
                    <InputGroupButtonDropdown addonType="append">
                      <IconButton
                        tooltip="Save PDF section name"
                        icon="SAVE"
                        block
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
                          icon="EDIT"
                          onClick={() => setIsEditingName(true)}
                        />
                      )}
                    </Col>
                  </Row>
                )}
              </CardFooter>
            </NameCard>
          )}
        <Container
          fluid
        >
          {!hidden && data && (
            <>
              {data.answers.map((answer) => (
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
              <div className="d-flex" ref={ref}>
                {data === undefined ? (
                  <ThreeButtons center={<Spinner />} />
                ) : (
                  <>
                    <ThreeButtons
                      left={
                        <>
                          {displayHideShowButtons ? (
                            <IconButton
                              className="mr-1"
                              size="sm"
                              icon={has_answers ? "VIEW_OFF" : "VIEW"}
                              tooltip="Toggle visibility"
                              onClick={() => {
                                if (data.answers.length == 0 || !has_answers) {
                                  onHasAnswersChange();
                                  data.allow_new_answer = true;
                                  data.allow_new_legacy_answer = true;
                                } else {
                                  setDeleteAnswersWarning(true);
                                }
                              }
                              }
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
                                allowAnswer={
                                  data.allow_new_answer
                                }
                                allowLegacyAnswer={
                                  data.allow_new_legacy_answer &&
                                  isCatAdmin
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
