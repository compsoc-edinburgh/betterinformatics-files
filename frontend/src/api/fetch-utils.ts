import { jwtDecode } from "jwt-decode";

/**
 * Check if the user is authenticated: checks whether the auth cookie is set and
 * has a value in the future. Note that this does not verify the cookie
 * signature and it can be forged by the client.
 * @returns Boolean whether the user is authenticated, or `undefined` if there
 * is no auth cookie.
 */
export function authenticated() {
  const access_token_jwt = getCookie("access_token");
  if (access_token_jwt === null) {
    return undefined;
  }
  // Attempt to get the exp field. Use empty object if jwtDecode returns undefined.
  const { exp } = jwtDecode(access_token_jwt) || {};
  if (exp === undefined) {
    return undefined;
  }
  // Multiply because exp is epoch but Date.now() is in milliseconds.
  return Date.now() < exp * 1000;
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

export function getHeaders(requestInit?: RequestInit) {
  const headers = new Headers(requestInit?.headers);
  headers.set("X-CSRFToken", getCookie("csrftoken") ?? "");
  if (localStorage.getItem("simulate_nonadmin")) {
    headers.set("SimulateNonAdmin", "true");
  }
  return Object.fromEntries(headers);
}

export async function performDataRequest<T>(
  method: string,
  url: string | URL,
  data: Record<string, any> | FormData | string | URLSearchParams,
  requestInit?: RequestInit,
): Promise<HttpResponse<T>> {
  // if (isTokenExpired()) await refreshToken();

  let formData: FormData | URLSearchParams | string = new FormData();
  if (
    data instanceof FormData ||
    data instanceof URLSearchParams ||
    typeof data === "string"
  ) {
    formData = data;
  } else {
    // Convert the `data` object into a `formData` object by iterating
    // through the keys and appending the (key, value) pair to the FormData
    // object. All non-Blob values are converted to a string.

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else {
        formData.append(key, value.toString());
      }
    }
  }

  const response = await fetch(url, {
    ...requestInit,
    credentials: "include",
    headers: getHeaders(requestInit),
    method,
    body: formData,
  });
  try {
    let body = undefined as T;
    if (response.status !== 204) {
      body = (await response.json()) as T;
    }
    if (!response.ok) {
      return Promise.reject((body as { err: string }).err);
    }
    return {
      data: body,
      status: response.status,
      headers: response.headers,
    };
  } catch (e: any) {
    return Promise.reject(e.toString());
  }
}

export interface HttpResponse<T> {
  status: number;
  headers: Headers;
  data: T;
}

export async function performRequest<T>(
  method: string,
  url: string | URL,
  requestInit?: RequestInit,
): Promise<HttpResponse<T>> {
  // if (isTokenExpired()) await refreshToken();

  const response = await fetch(url, {
    ...requestInit,
    credentials: "include",
    headers: getHeaders(requestInit),
    method,
  });
  try {
    let body = undefined as T;
    if (response.status !== 204) {
      body = (await response.json()) as T;
    }
    if (!response.ok) {
      return Promise.reject((body as { err: string }).err);
    }
    return {
      data: body,
      status: response.status,
      headers: response.headers,
    };
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
export async function fetchPost<T = any>(
  url: string,
  data: Record<string, any>,
): Promise<T> {
  const response = await performDataRequest<T>("POST", url, data);
  return response.data;
}

export async function fetchPut<T = any>(
  url: string,
  data: Record<string, any>,
): Promise<T> {
  const response = await performDataRequest<T>("PUT", url, data);
  return response.data;
}

export async function fetchPatch<T = any>(
  url: string,
  data: Record<string, any>,
): Promise<T> {
  const response = await performDataRequest<T>("PATCH", url, data);
  return response.data;
}

export async function fetchDelete<T = any>(url: string): Promise<T> {
  const response = await performRequest<T>("DELETE", url);
  return response.data;
}

export async function fetchGet<T = any>(url: string): Promise<T> {
  const response = await performRequest<T>("GET", url);
  return response.data;
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
