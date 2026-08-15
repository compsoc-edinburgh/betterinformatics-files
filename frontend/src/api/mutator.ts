import {
  performRequest,
  performDataRequest,
  type HttpResponse,
} from "./fetch-utils";

// We need a custom fetch wrapper to make it work with performRequest and performDataRequest
// Orval works with exactly one function, so we need a "router" function anyway.
export const customFetch = async <T>(
  url: string | URL,
  options: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  } & RequestInit,
): Promise<T> => {
  let response: HttpResponse<T>;

  if (options.method === "GET" || options.method === "DELETE") {
    response = await performRequest<T>(options.method, url, options);
  } else {
    const body = options.body;

    response = await performDataRequest<T>(
      options.method,
      url,
      body ?? {},
      options,
    );
  }

  return response.data;
};
