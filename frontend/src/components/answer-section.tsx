import {
  Button,
  Card,
  CardHeader,
  Container,
  Spinner,
} from "@vseth/components";
import React, { useEffect } from "react";
import { fetchapi } from "../fetch-utils";
import { AnswerSection } from "../interfaces";
import { useRequest, useInViewport } from "@umijs/hooks";

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
const Spacer: React.FC<{}> = () => <div style={{ flexGrow: 1 }} />;
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
    if (data === undefined && loading === false && visible) {
      run();
    }
  }, [data, loading, visible, run]);

  return (
    <Container style={{ marginTop: "2em", marginBottom: "2em" }}>
      <Card>
        <CardHeader>
          <div style={{ display: "flex" }} ref={ref}>
            {data === undefined ? (
              <>
                <Spacer />
                <Spinner />
                <Spacer />
              </>
            ) : (
              <>
                <Spacer />
                <Button color="primary" size="sm">
                  {hidden ? "Show Answers" : "Hide Answers"}
                </Button>
                <Spacer />
              </>
            )}
          </div>
        </CardHeader>
      </Card>
    </Container>
  );
};

export default AnswerSectionComponent;
