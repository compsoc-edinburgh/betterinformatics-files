import { CategoryExam } from "../interfaces";
import { useUser } from "../auth";
import { claimExpiryRelative, hasValidClaim } from "../utils/exam-utils";
import { Button, ButtonProps } from "@mantine/core";
import React from "react";
import { useRequest } from "ahooks";
import TooltipButton from "./TooltipButton";
import { claimExam } from "../api/hooks";

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
  const { loading, run: runSetClaim } = useRequest(claimExam, {
    manual: true,
    onSuccess: reloadExams,
  });
  return hasValidClaim(exam) ? (
    exam.import_claim === username ? (
      <Button
        size="sm"
        color="gray"
        variant="outline"
        onClick={e => {
          e.stopPropagation();
          void runSetClaim(exam.filename, false);
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
        tooltip={`Expires ${claimExpiryRelative(exam.import_claim_time)}`}
        disabled
        {...buttonProps}
      >
        Claimed by {exam.import_claim_displayname}
      </TooltipButton>
    )
  ) : (
    <Button
      size="sm"
      variant="filled"
      onClick={e => {
        e.stopPropagation();
        void runSetClaim(exam.filename, true);
      }}
      disabled={loading}
      {...buttonProps}
    >
      Claim Exam
    </Button>
  );
};
export default ClaimButton;
