import { ImageHandle } from "../components/Editor/utils/types";

async function performDataRequest(
  method: string,
  url: string,
  data: { [key: string]: any },
) {
  const formData = new FormData();
  // Convert the `data` object into a `formData` object by iterating
  // through the keys and appending the (key, value) pair to the FormData
  // object. All non-Blob values are converted to a string.
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const val = data[key];
      if (val instanceof File || val instanceof Blob) {
        formData.append(key, val);
      } else {
        formData.append(key, val.toString());
      }
    }
  }
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "X-CSRFToken": getCookie("csrftoken") || "",
    },
    method,
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

async function performRequest(method: string, url: string) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "X-CSRFToken": getCookie("csrftoken") || "",
    },
    method: method,
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

export function getCookie(name: string): string | null {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
export function fetchPost(url: string, data: { [key: string]: any }) {
  return performDataRequest("POST", url, data);
}

export function fetchPut(url: string, data: { [key: string]: any }) {
  return performDataRequest("PUT", url, data);
}

export function fetchDelete(url: string) {
  return performRequest("DELETE", url);
}

export function fetchGet(url: string) {
  return performRequest("GET", url);
}

export function imageHandler(file: File): Promise<ImageHandle> {
  return new Promise((resolve, reject) => {
    fetchPost("/api/image/upload/", {
      file: file,
    })
      .then(res => {
        resolve({
          name: file.name,
          src: res.filename,
          remove: async () => {
            await fetchPost(`/api/image/remove/${res.filename}/`, {});
          },
        });
      })
      .catch(e => reject(e));
  });
}
