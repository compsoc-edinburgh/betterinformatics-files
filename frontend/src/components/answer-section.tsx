import { useInViewport, useRequest } from "@umijs/hooks";
import {
  Button,
  ButtonDropdown,
  ButtonGroup,
  Card,
  CardHeader,
  Container,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Icon,
  ICONS,
  Spinner,
  UncontrolledDropdown,
} from "@vseth/components";
import React, { useCallback, useEffect, useState } from "react";
import { useUser } from "../auth";
import { fetchapi, fetchpost } from "../fetch-utils";
import { AnswerSection } from "../interfaces";
import AnswerComponent from "./answer";
import ThreeButtons from "./three-buttons";

const loadAnswers = async (oid: string) => {
  return (await fetchapi(`/api/exam/answersection/${oid}/`))
    .value as AnswerSection;
};
const removeSplit = async (oid: string) => {
  return await fetchpost(`/api/exam/removecut/${oid}/`, {});
};

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
      <ButtonDropdown isOpen={isOpen} toggle={toggle}>
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
      <ButtonGroup>
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
  isExpert: boolean;
  filename: string;
  oid: string;
  width: number;
  canDelete: boolean;
  onSectionChange: () => void;
  onToggleHidden: () => void;
  hidden: boolean;
  cutVersion: number;
  setCutVersion: (newVersion: number) => void;
}

const AnswerSectionComponent: React.FC<Props> = ({
  isExpert,
  filename,
  oid,
  width,
  canDelete,
  onSectionChange,
  onToggleHidden,
  hidden,
  cutVersion,
  setCutVersion,
}) => {
  const [data, setData] = useState<AnswerSection | undefined>();
  const setAnswerSection = useCallback(
    (newData: AnswerSection) => {
      setCutVersion(newData.cutVersion);
      setData(newData);
    },
    [setCutVersion],
  );
  const { run: runRemoveSplit } = useRequest(() => removeSplit(oid), {
    manual: true,
    onSuccess: onSectionChange,
  });
  const { loading, run } = useRequest(() => loadAnswers(oid), {
    manual: true,
    onSuccess: setData,
  });
  const [inViewport, ref] = useInViewport<HTMLDivElement>();
  const visible = inViewport || false;
  useEffect(() => {
    if (
      (data === undefined || data.cutVersion !== cutVersion) &&
      loading === false &&
      visible
    ) {
      run();
    }
  }, [data, loading, visible, run, cutVersion]);
  const [hasDraft, setHasDraft] = useState(false);
  const [hasLegacyDraft, setHasLegacyDraft] = useState(false);
  const onAddAnswer = () => {
    setHasDraft(true);
    if (hidden) onToggleHidden();
  };
  const onAddLegacyAnswer = () => {
    setHasLegacyDraft(true);
    if (hidden) onToggleHidden();
  };
  const user = useUser()!;
  const isCatADmin = user.isCategoryAdmin;
  return (
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
      <Card style={{ marginTop: "2em", marginBottom: "2em" }}>
        <CardHeader>
          <div style={{ display: "flex" }} ref={ref}>
            {data === undefined ? (
              <>
                <ThreeButtons center={<Spinner />} />
              </>
            ) : (
              <>
                <ThreeButtons
                  left={
                    (data.answers.length === 0 || !hidden) &&
                    data && (
                      <AddButton
                        allowAnswer={data.allow_new_answer}
                        allowLegacyAnswer={data.allow_new_legacy_answer}
                        hasAnswerDraft={hasDraft}
                        hasLegacyAnswerDraft={hasLegacyDraft}
                        onAnswer={onAddAnswer}
                        onLegacyAnswer={onAddLegacyAnswer}
                      />
                    )
                  }
                  center={
                    data.answers.length > 0 && (
                      <Button
                        color="primary"
                        size="sm"
                        onClick={onToggleHidden}
                      >
                        {hidden ? "Show Answers" : "Hide Answers"}
                      </Button>
                    )
                  }
                  right={
                    isCatADmin && (
                      <UncontrolledDropdown>
                        <DropdownToggle caret size="sm">
                          <Icon icon={ICONS.DOTS_H} size={18} />
                        </DropdownToggle>
                        <DropdownMenu>
                          <DropdownItem onClick={runRemoveSplit}>
                            Delete
                          </DropdownItem>
                          <DropdownItem>Move</DropdownItem>
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    )
                  }
                />
              </>
            )}
          </div>
        </CardHeader>
      </Card>
    </Container>
  );
};

export default AnswerSectionComponent;
