export async function fetchpost(url: string, data: object) {
  var formData = new FormData();
  for (var key in data) {
    formData.append(key, data[key]);
  }
  return await fetch(url, {
    method: "POST",
    body: formData
  });
}
