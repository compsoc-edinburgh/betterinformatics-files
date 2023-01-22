import { CategoryExam } from "../interfaces";
import { useUser } from "../auth";
import { hasValidClaim } from "../utils/exam-utils";
import { Button } from "@mantine/core";
import React from "react";
import { fetchPost } from "../api/fetch-utils";
import { useRequest } from "@umijs/hooks";
import TooltipButton from "./TooltipButton";

const setClaim = async (filename: string, claim: boolean) => {
  await fetchPost(`/api/exam/claimexam/${filename}/`, {
    claim,
  });
};

interface Props {
  exam: CategoryExam;
  reloadExams: () => void;
}
const ClaimButton: React.FC<Props> = ({ exam, reloadExams }) => {
  const { username } = useUser()!;
  const { loading, run: runSetClaim } = useRequest(setClaim, {
    manual: true,
    onSuccess: reloadExams,
  });
  return !exam.finished_cuts || !exam.finished_wiki_transfer ? (
    hasValidClaim(exam) ? (
      exam.import_claim === username ? (
        <Button
          size="sm"
          color="dark"
          variant="outline"
          onClick={e => {
            e.stopPropagation();
            runSetClaim(exam.filename, false);
          }}
          disabled={loading}
        >
          Release Claim
        </Button>
      ) : (
        <TooltipButton
          size="sm"
          color="white"
          active
          tooltip={`Claimed by ${exam.import_claim_displayname}`}
        >
          Claimed
        </TooltipButton>
      )
    ) : (
      <Button
        size="sm"
        color="dark"
        variant="outline"
        onClick={e => {
          e.stopPropagation();
          runSetClaim(exam.filename, true);
        }}
        disabled={loading}
      >
        Claim Exam
      </Button>
    )
  ) : null;
};
export default ClaimButton;
