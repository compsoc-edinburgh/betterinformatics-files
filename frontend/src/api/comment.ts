import { AnswerSection } from "../interfaces";
import { fetchPost } from "./fetch-utils";

export const addNewComment = async (answerId: string, text: string) => {
  return (
    await fetchPost(`/api/exam/addcomment/${answerId}/`, {
      text,
    })
  ).value as AnswerSection;
};
export const updateComment = async (commentId: string, text: string) => {
  return (
    await fetchPost(`/api/exam/setcomment/${commentId}/`, {
      text,
    })
  ).value as AnswerSection;
};
export const removeComment = async (commentId: string) => {
  return (await fetchPost(`/api/exam/removecomment/${commentId}/`, {}))
    .value as AnswerSection;
};
