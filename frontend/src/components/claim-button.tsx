import { CategoryExam } from "../interfaces";
import { useUser } from "../auth";
import { hasValidClaim } from "../utils/exam-utils";
import { Button, ButtonProps } from "@mantine/core";
import React from "react";
import { fetchPost } from "../api/fetch-utils";
import { useRequest } from "@umijs/hooks";
import TooltipButton from "./TooltipButton";

const setClaim = async (filename: string, claim: boolean) => {
  await fetchPost(`/api/exam/claimexam/${filename}/`, {
    claim,
  });
};

interface Props extends ButtonProps {
  exam: CategoryExam;
  reloadExams: () => void;
}
const ClaimButton: React.FC<Props> = ({
  exam,
  reloadExams,
  ...buttonProps
}) => {
  const { username } = useUser()!;
  const { loading, run: runSetClaim } = useRequest(setClaim, {
    manual: true,
    onSuccess: reloadExams,
  });
  return !exam.finished_cuts ? (
    hasValidClaim(exam) ? (
      exam.import_claim === username ? (
        <Button
          mt="xs"
          size="sm"
          color="dark"
          variant="outline"
          onClick={e => {
            e.stopPropagation();
            runSetClaim(exam.filename, false);
          }}
          disabled={loading}
          {...buttonProps}
        >
          Release Claim
        </Button>
      ) : (
        <TooltipButton
          size="sm"
          color="white"
          tooltip={`Claimed by ${exam.import_claim_displayname}`}
          {...buttonProps}
        >
          Claimed
        </TooltipButton>
      )
    ) : (
      <Button
        size="sm"
        variant="default"
        onClick={e => {
          e.stopPropagation();
          runSetClaim(exam.filename, true);
        }}
        disabled={loading}
        {...buttonProps}
      >
        Claim Exam
      </Button>
    )
  ) : null;
};
export default ClaimButton;
