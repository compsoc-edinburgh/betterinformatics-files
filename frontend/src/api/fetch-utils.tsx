import { ImageHandle } from "../components/Editor/utils/types";

/**
 * Minimum validity of the access token in seconds when a request to the API starts
 */
export const minValidity = 10;

let refreshRequest: Promise<Response> | undefined = undefined;

export function authenticationStatus() {
  const expires = getCookie("token_expires");
  if (expires === null) {
    return undefined;
  }
  const now = new Date().getTime();
  const time = new Date(parseFloat(expires) * 1000).getTime();
  return time - now;
}

/**
 * Checks whether it would make sense to call `refreshToken()`
 * @returns Returns `true` iff. there is a token and it is expired.
 */
export function isTokenExpired(expires = authenticationStatus()) {
  if (expires === undefined) return false;
  return expires < minValidity * 1000;
}

/**
 * Checks whether it makes sense to
 * @returns
 */
export function authenticated(expires = authenticationStatus()) {
  return expires !== undefined;
}

const encodeScopes = (...scopes: string[]) => scopes.join("+");

const scopes = encodeScopes("profile", "openid");

export function login(redirectUrl = window.location.pathname) {
  window.location.href = `/api/auth/login?scope=${scopes}&rd=${encodeURIComponent(
    redirectUrl,
  )}`;
}

export function logout(redirectUrl = window.location.pathname) {
  window.location.href = `/api/auth/logout?rd=${encodeURIComponent(
    redirectUrl,
  )}`;
}

export function refreshToken() {
  if (refreshRequest !== undefined) {
    return refreshRequest;
  }
  refreshRequest = fetch("/api/auth/refresh", {
    headers: getHeaders(),
  }).then(req => {
    refreshRequest = undefined;
    return req;
  });
  return refreshRequest;
}

export function getHeaders() {
  const headers: Record<string, string> = {
    "X-CSRFToken": getCookie("csrftoken") || "",
  };
  if (localStorage.getItem("simulate_nonadmin")) {
    headers["SimulateNonAdmin"] = "true";
  }
  return headers;
}
/**
 * `NamedBlob` is essentially a 2-tuple consisting of a `Blob` and a `string` acting as
 * a filename. A `NamedBlob` can be passed to `performDataRequest` if the `Blob` should have
 * a multipart filename attached to it.
 */
export class NamedBlob {
  constructor(
    public blob: Blob,
    public filename: string,
  ) {}
}
async function performDataRequest<T>(
  method: string,
  url: string,
  data: { [key: string]: any },
) {
  if (isTokenExpired()) await refreshToken();

  const formData = new FormData();
  // Convert the `data` object into a `formData` object by iterating
  // through the keys and appending the (key, value) pair to the FormData
  // object. All non-Blob values are converted to a string.
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const val = data[key];
      if (val === undefined) continue;
      if (val instanceof File || val instanceof Blob) {
        formData.append(key, val);
      } else if (val instanceof NamedBlob) {
        formData.append(key, val.blob, val.filename);
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
  } catch (e: any) {
    return Promise.reject(e.toString());
  }
}

async function performRequest<T>(method: string, url: string) {
  if (isTokenExpired()) await refreshToken();

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
  } catch (e: any) {
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

export function download(url: string, name?: string) {
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.href = url;
  a.target = "_blank";
  a.download = name ?? "file";
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
  }, 0);
}

export async function downloadIndirect(url: string) {
  const { value: signedUrl } = await fetchGet(url);
  download(signedUrl);
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
