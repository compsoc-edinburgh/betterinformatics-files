import styled from "@emotion/styled";
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
} from "@vseth/components";
import React, { useCallback, useEffect, useState } from "react";
import { useAnswers, useRemoveSplit } from "../api/hooks";
import { useUser } from "../auth";
import useInitialState from "../hooks/useInitialState";
import useLoad from "../hooks/useLoad";
import { AnswerSection } from "../interfaces";
import AnswerComponent from "./answer";
import IconButton from "./icon-button";
import ThreeButtons from "./three-columns";

const NameCard = styled(Card)`
  border-top-left-radius: 0;
  border-top-right-radius: 0;
`;

const AnswerSectionButtonWrapper = styled(Card)`
  margin-top: 1em;
  margin-bottom: 1em;
`;

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

  cutName: string;
  onCutNameChange: (newName: string) => void;

  onCancelMove: () => void;
  onMove: () => void;
  isBeingMoved: boolean;

  displayEmptyCutLabels: boolean;
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
    }, [data, visible, run, cutVersion, hidden]);
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
        {data &&
          ((cutName && cutName.length > 0) ||
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
            color={isBeingMoved ? "primary" : undefined}
          >
            <CardHeader>
              <div className="d-flex" ref={ref}>
                {data === undefined ? (
                  <ThreeButtons center={<Spinner />} />
                ) : (
                  <>
                    <ThreeButtons
                      left={
                        isBeingMoved ? (
                          <Button size="sm" onClick={onCancelMove}>
                            Cancel
                          </Button>
                        ) : (
                          (data.answers.length === 0 || !hidden) &&
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
                        )
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
