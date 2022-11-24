import moment from "moment";
import GlobalConsts from "../globalconsts";
import { CategoryExam } from "../interfaces";

export const hasValidClaim = (exam: CategoryExam) => {
  if (exam.import_claim !== null && exam.import_claim_time !== null) {
    if (
      moment().diff(
        moment(exam.import_claim_time, GlobalConsts.momentParseString),
      ) <
      4 * 60 * 60 * 1000
    ) {
      return true;
    }
  }
  return false;
};

export const getAnswerSectionId = (sectionId: string, cutName: string) => {
  const nameParts = cutName.split(" > ");
  return `${sectionId}-${nameParts.join("-")}`;
};
