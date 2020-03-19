import {
  Button,
  ButtonDropdown,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Container,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
} from "@vseth/components";
import React, { useCallback, useState } from "react";
import { Answer, AnswerSection } from "../interfaces";
import MarkdownText from "./markdown-text";

interface Props {
  section: AnswerSection;
  answer?: Answer;
  onSectionChanged: (newSection: AnswerSection) => void;
}
const AnswerComponent: React.FC<Props> = ({ section, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen(old => !old), []);
  return (
    <>
      <Card style={{ marginTop: "2em", marginBottom: "2em" }}>
        <CardHeader>{answer?.authorDisplayName ?? "(Draft)"}</CardHeader>
        <CardBody>
          <MarkdownText value={answer?.text ?? ""} />
          <div style={{ textAlign: "right" }}>
            <ButtonGroup>
              <Button size="sm">Add Comment</Button>
              <ButtonDropdown isOpen={isOpen} toggle={toggle}>
                <DropdownToggle size="sm" caret>
                  More
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem>Flag as Inappropriate</DropdownItem>
                  <DropdownItem>Permalink</DropdownItem>
                </DropdownMenu>
              </ButtonDropdown>
            </ButtonGroup>
          </div>
        </CardBody>
      </Card>
      {answer && answer.comments.length > 0 && (
        <Container>
          {answer.comments.map(comment => (
            <>{comment.text}</>
          ))}
        </Container>
      )}
    </>
  );
};

export default AnswerComponent;
