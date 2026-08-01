import { uploadImage, removeImage } from "./hooks/images";
import { ImageHandle } from "../components/Editor/utils/types";

export async function imageHandler(file: File): Promise<ImageHandle> {
  const result = await uploadImage({ file });

  return {
    name: file.name,
    src: result.filename,
    async remove() {
      await removeImage(result.filename);
    },
  };
}
