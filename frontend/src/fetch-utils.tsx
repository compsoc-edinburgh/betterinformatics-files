export async function fetchpost(url: string, data: object) {
  var formData = new FormData();
  for (var key in data) {
    formData.append(key, data[key]);
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

export async function fetchpostArray(url: string, key: string, data: Iterable<string>) {
  var formData = new FormData();
  for (var x in data) {
    formData.append(key, x);
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
