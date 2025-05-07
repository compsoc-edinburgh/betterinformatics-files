import { fetchGet, fetchPost } from "./fetch-utils";

export const addNewFavourite = async (slug: string) => {
  const url = `/api/favourites/add/${slug}/`;
  await fetchPost(url, {})
};;


export const getFavourites = async () => {
  return (await fetchGet("/api/favourites/")).value as string[];
};

export const removeFavourite = async (slug: string) => {
  return (await fetchPost(`/api/favourites/remove/${slug}/`, {}))
}
