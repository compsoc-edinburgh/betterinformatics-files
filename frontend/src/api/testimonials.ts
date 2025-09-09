import { fetchGet, fetchPost } from "./fetch-utils";

export const loadEuclidList = async () => {
    return (await fetchGet("/api/category/listeuclidcodes/")).value as {
      code: string;
      category: string;
    }[];
  };

export const loadTestimonials = async () => {
    return (await fetchGet("/api/testimonials/listtestimonials"))
};

export const removeTestimonial = async (testimonialId: string) => {
    return (await fetchPost(`/api/testimonials/removetestimonial/${testimonialId}/`, {}));
};
