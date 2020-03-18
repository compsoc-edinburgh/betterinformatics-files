import React from "react";
import { Container, Card, CardHeader, Button } from "@vseth/components";
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
const AnswerSection: React.FC<Props> = ({
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
  return (
    <Container style={{ marginTop: "2em", marginBottom: "2em" }}>
      <Card>
        <CardHeader>
          <Button>Test</Button>
        </CardHeader>
      </Card>
    </Container>
  );
};

export default AnswerSection;
