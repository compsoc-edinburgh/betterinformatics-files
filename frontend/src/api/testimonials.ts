import { Testimonial } from "../interfaces";
import { fetchGet, fetchPost } from "./fetch-utils";
export const loadTestimonialsByCourse = async (slug : string) => {
    return (await fetchGet(`/api/testimonials/listtestimonialsbycourse/${slug}/`)).value as Testimonial[]
};