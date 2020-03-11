export async function fetchpost(url: string, data: { [key: string]: any }) {
  const formData = new FormData();
  // Convert the `data` object into a `formData` object by iterating
  // through the keys and appending the (key, value) pair to the FormData
  // boject. All non-Blob values are converted to a string.
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
