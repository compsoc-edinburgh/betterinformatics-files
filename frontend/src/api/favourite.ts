import { fetchGet, fetchPost } from "./fetch-utils";

export const addNewFavourite = async (slug: string) => {
  const url = `/api/favourites/add/${slug}/`;
  const success = await fetchPost(`/api/favourites/add/${slug}/`, {})
};;


export const getFavourites = async () => {
  return (await fetchGet("/api/favourites/")).value as string[];
};

export const removeFavourite = async (slug: string) => {
  return (await fetchPost(`/api/favourites/remove/${slug}/`, {}))
}
