export async function fetchpost(url: string, data: object) {
  var formData = new FormData();
  for (var key in data) {
    formData.append(key, data[key]);
  }
  const response = await fetch(url, {
    credentials: 'include',
    method: "POST",
    body: formData
  });
  const body = await response.json();
  console.log(response);
  if (!response.ok) {
    return Promise.reject(body.err);
  }
  return body;
}

export async function fetchapi(url: string) {
  const response = await fetch(url, {
    credentials: 'include'
  });
  const body = await response.json();
  if (!response.ok) {
    return Promise.reject(body.err);
  }
  return body;
}
