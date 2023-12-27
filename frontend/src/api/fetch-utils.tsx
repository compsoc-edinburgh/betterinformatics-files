import { ImageHandle } from "../components/Editor/utils/types";
import { jwtDecode } from "jwt-decode";

/**
 * Check if the user is authenticated.
 * @returns The number of seconds before the auth token expires, or `undefined`
 * if there is no auth cookie.
 */
function authenticationStatus() {
  const access_token_jwt = getCookie("access_token");
  if (access_token_jwt === null) {
    return undefined;
  }
  const claims = jwtDecode(access_token_jwt);
  const now = new Date().getTime();
  const time = new Date(claims["exp"]).getTime();
  return time - now;
}

/**
 * Checks whether the auth cookie is set and has a value in the future. Note
 * that this does not verify the cookie signature and it can be forged by the
 * client.
 * @returns
 */
export function authenticated(expires = authenticationStatus()) {
  return expires !== undefined && expires > 0;
}

// First step of the login, generates a verification code. The backend will
// store the code in the database (so a repeat call to login() will use the
// same code until a time limit), then send an email to the user with the code.
// The user will then enter the code in the frontend, which will call the second
// function - verifyLoginCode().
export function sendLoginCode(uun: string) {
  return fetchPost(`/api/auth/login`, { uun });
}

export function verifyLoginCode(uun: string, code: string) {
  return fetchPost("/api/auth/verify", { uun, code });
}

export function logout(redirectUrl = window.location.pathname) {
  window.location.href = `/api/auth/logout?rd=${encodeURIComponent(
    redirectUrl,
  )}`;
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
  // if (isTokenExpired()) await refreshToken();

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
  // if (isTokenExpired()) await refreshToken();

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
