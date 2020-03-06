import { ImageHandle } from "./components/Editor/utils/types";

export async function fetchpost(url: string, data: { [key: string]: any }) {
  const formData = new FormData();
  for (const key in data) {
    const val = data[key];
    if (val instanceof File || val instanceof Blob) {
      formData.append(key, val);
    } else {
      formData.append(key, val.toString());
    }
  }
  const response = await fetch(url, {
    credentials: "include",
    method: "POST",
    body: formData,
  });
  try {
    const body = await response.json();
    if (!response.ok) {
      return Promise.reject(body.err);
    }
    return body;
  } catch (e) {
    return Promise.reject(e.toString());
  }
}

export async function fetchapi(url: string) {
  const response = await fetch(url, {
    credentials: "include",
  });
  try {
    const body = await response.json();
    if (!response.ok) {
      return Promise.reject(body.err);
    }
    return body;
  } catch (e) {
    return Promise.reject(e.toString());
  }
}

export function imageHandler(file: File): Promise<ImageHandle> {
  return new Promise((resolve, reject) => {
    fetchpost("/api/uploadimg", {
      file: file,
    })
      .then(res => {
        resolve({
          name: file.name,
          src: res.filename,
          remove: async () => {
            await fetchpost(`/api/image/${res.filename}/remove`, {});
          },
        });
      })
      .catch(e => reject(e));
  });
}
