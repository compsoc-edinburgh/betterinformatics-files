import { CategoryExam } from "../interfaces";
import { useUser } from "../auth";
import { hasValidClaim } from "../utils/exam-utils";
import { Button } from "@vseth/components";
import React from "react";
import { fetchPost } from "../api/fetch-utils";
import { useRequest } from "@umijs/hooks";

const setClaim = async (filename: string, claim: boolean) => {
  await fetchPost(`/api/exam/claimexam/${filename}/`, {
    claim: claim,
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
          onClick={() => runSetClaim(exam.filename, false)}
          disabled={loading}
        >
          Release Claim
        </Button>
      ) : (
        <span>Claimed by {exam.import_claim_displayname}</span>
      )
    ) : (
      <Button
        onClick={() => runSetClaim(exam.filename, true)}
        disabled={loading}
      >
        Claim Exam
      </Button>
    )
  ) : (
    <span>-</span>
  );
};
export default ClaimButton;
