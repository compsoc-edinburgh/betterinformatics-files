import { fetchGet, fetchPost } from "./fetch-utils";
import { useRequest } from "@umijs/hooks";
import { remove } from "lodash-es";

export const loadImage = async () => {
  return (await fetchGet("/api/image/list/")).value as string[];
};
export const removeImage = async (image: string) => {
  await fetchPost(`/api/image/remove/${image}/`, {});
  return image;
};
export const uploadImage = async (file: File) => {
  return (await fetchPost("/api/image/upload/", { file })).filename as string;
};

export const useImages = () => {
  const {
    data: images,
    mutate,
    run: reload,
  } = useRequest(loadImage, {
    cacheKey: "images",
  });

  const { run: runRemoveImage } = useRequest(removeImage, {
    manual: true,
    fetchKey: id => id,
    onSuccess: removed => {
      mutate(prev => prev.filter(image => image !== removed));
      remove(removed);
    },
  });
  const { run: runUploadImage } = useRequest(uploadImage, {
    manual: true,
    onSuccess: added => {
      mutate(prevSelected => [...prevSelected, added]);
    },
  });
  return {
    images,
    add: runUploadImage,
    remove: runRemoveImage,
    reload,
  } as const;
};
