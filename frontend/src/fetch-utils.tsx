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
    headers: {
      "X-CSRFToken": getCookie("csrftoken") || "",
    },
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
