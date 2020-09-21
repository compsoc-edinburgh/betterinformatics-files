import { ImageHandle } from "../components/Editor/utils/types";
import keycloak from "../keycloak";
/**
 * Minimum validity of the keycloak token in seconds when a request to the API starts
 */
export const minValidity = 10;

export function getHeaders() {
  const headers: Record<string, string> = {
    "X-CSRFToken": getCookie("csrftoken") || "",
  };
  if (keycloak.token) {
    headers["Authorization"] = `Bearer ${keycloak.token}`;
  }
  if (localStorage.getItem("simulate_nonadmin")) {
    headers["X-SimulateNonAdmin"] = "true";
  }
  return headers;
}

async function performDataRequest<T>(
  method: string,
  url: string,
  data: { [key: string]: any },
) {
  if (keycloak.isTokenExpired(minValidity))
    await keycloak.updateToken(minValidity);
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
    headers: getHeaders(),
    method,
    body: formData,
  });
  try {
    const body = await response.json();
    if (!response.ok) {
      return Promise.reject(body.err);
    }
    return body as T;
  } catch (e) {
    return Promise.reject(e.toString());
  }
}

async function performRequest<T>(method: string, url: string) {
  if (keycloak.isTokenExpired(minValidity))
    await keycloak.updateToken(minValidity);
  const response = await fetch(url, {
    credentials: "include",
    headers: getHeaders(),
    method,
  });
  try {
    const body = await response.json();
    if (!response.ok) {
      return Promise.reject(body.err);
    }
    return body as T;
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
      if (cookie.substring(0, name.length + 1) === `${name}=`) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
export function fetchPost<T = any>(url: string, data: { [key: string]: any }) {
  return performDataRequest<T>("POST", url, data);
}

export function fetchPut<T = any>(url: string, data: { [key: string]: any }) {
  return performDataRequest<T>("PUT", url, data);
}

export function fetchDelete<T = any>(url: string) {
  return performRequest<T>("DELETE", url);
}

export function fetchGet<T = any>(url: string) {
  return performRequest<T>("GET", url);
}

export function imageHandler(file: File): Promise<ImageHandle> {
  return new Promise((resolve, reject) => {
    fetchPost("/api/image/upload/", {
      file,
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
