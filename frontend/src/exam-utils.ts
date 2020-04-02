import { CategoryExam } from "./interfaces";
import moment from "moment";
import GlobalConsts from "./globalconsts";

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
