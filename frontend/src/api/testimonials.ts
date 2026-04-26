import { fetchGet, fetchPost } from "./fetch-utils";

export const listCategories = async () => {
    return (await fetchGet(`/api/category/list/?include_euclid_codes=true`)).value as {
      displayname: string;
      slug: string;
      euclid_codes: string[];
    }[];
  };

export const loadTestimonials = async () => {
    return (await fetchGet("/api/testimonials/listtestimonials/"))
};

export const removeTestimonial = async (testimonialId: string) => {
    return (await fetchPost(`/api/testimonials/removetestimonial/${testimonialId}/`, {}));
};
