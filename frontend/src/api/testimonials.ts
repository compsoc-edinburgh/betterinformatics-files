import { fetchGet, fetchPost } from "./fetch-utils";
import { useRequest } from "@umijs/hooks";
import { remove } from "lodash-es";

export const loadCourses = async () => {
    return (await fetchGet("/api/testimonials/listcourses"))
};

export const loadTestimonials = async () => {
    return (await fetchGet("/api/testimonials/listtestimonials"))
};

export const removeTestimonial = async (testimonialId: string) => {
    return (await fetchPost(`/api/testimonials/removetestimonial/${testimonialId}/`, {}));
};
