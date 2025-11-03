import { differenceInHours, formatRelative, parseISO } from "date-fns";
import { CategoryExam } from "../interfaces";

export const hasValidClaim = (exam: CategoryExam) => {
  if (exam.import_claim !== null && exam.import_claim_time !== null) {
    if (differenceInHours(new Date(), parseISO(exam.import_claim_time)) < 4) {
      return true;
    }
  }
  return false;
};

export const claimExpiryRelative = (import_claim_time: string | null) => {
  if (import_claim_time) {
    return formatRelative(parseISO(import_claim_time), new Date());
  }
}


export const getAnswerSectionId = (sectionId: string, cutName: string) => {
  const nameParts = cutName.split(" > ");
  return `${sectionId}-${nameParts.join("-")}`;
};
