export async function fetchpost(url: string, data: object) {
  var formData = new FormData();
  for (var key in data) {
    formData.append(key, data[key]);
  }
  return await fetch(url, {
    credentials: 'include',
    method: "POST",
    body: formData
  });
}

export async function fetchapi(url: string) {
  return await fetch(url, {
    credentials: 'include'
  });
}
