import { useInViewport, useRequest } from "@umijs/hooks";
import {
  Button,
  Card,
  CardHeader,
  Container,
  Spinner,
} from "@vseth/components";
import React, { useEffect, useState } from "react";
import { fetchapi } from "../fetch-utils";
import { AnswerSection } from "../interfaces";
import AnswerComponent from "./answer";
import ThreeButtons from "./three-buttons";

const loadAnswers = async (oid: string) => {
  return (await fetchapi(`/api/exam/answersection/${oid}/`))
    .value as AnswerSection;
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
}) => {
  const { loading, data, run } = useRequest(() => loadAnswers(oid), {
    manual: true,
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

  return (
    <Container fluid>
      {!hidden && data && (
        <>
          {" "}
          {data.answers.map(answer => (
            <AnswerComponent
              key={answer.oid}
              section={data}
              answer={answer}
              onSectionChanged={() => {}}
            />
          ))}
          {hasDraft && (
            <AnswerComponent
              section={data}
              onSectionChanged={() => {}}
              onDelete={() => setHasDraft(false)}
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
                    (data.answers.length === 0 || !hidden) && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setHasDraft(true);
                          if (hidden) onToggleHidden();
                        }}
                        disabled={hasDraft}
                      >
                        Add Answer
                      </Button>
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
