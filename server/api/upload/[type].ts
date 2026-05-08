import { getQuery, getRequestHeader, readRawBody } from "h3";

export default defineEventHandler(async (event) => {
  const type = event.context.params?.type || "files";
  const query = getQuery(event);
  const nome = Array.isArray(query.nome)
    ? query.nome[0]
    : query.nome || "upload";

  const runtimeConfig = useRuntimeConfig();
  const backendBase = runtimeConfig.backendBase || "https://apisam.netdw.tech";
  const target = `${backendBase.replace(/\/+$/, "")}/api/upload/${type}?nome=${encodeURIComponent(String(nome))}`;

  // Forward content-type if provided by the client
  const headers: Record<string, string> = {};
  const ct = getRequestHeader(event, "content-type");
  if (ct) headers["content-type"] = ct;

  // Use the correct request/response objects for different runtimes
  const req = (event.node?.req ||
    (event as unknown as { req?: unknown }).req) as
    | { method?: string }
    | undefined;
  const resObj = (event.node?.res ||
    (event as unknown as { res?: unknown }).res) as
    | { statusCode?: number }
    | undefined;

  // Determine request method
  const method = event.method || (req && req.method) || "GET";

  try {
    // For GET requests, don't read body
    if (method === "GET") {
      const res = await $fetch(target, {
        method: "GET",
        headers,
      });

      return res;
    }

    // For POST/PUT, read and forward the raw body as bytes
    const body = await readRawBody(event, false);

    if (!body) {
      throw new Error("Empty upload body");
    }

    const res = await $fetch(target, {
      method: method,
      headers,
      body: body,
    });

    return res;
  } catch (err: unknown) {
    const error = err as {
      statusCode?: number;
      message?: string;
      statusMessage?: string;
    };
    if (resObj) {
      resObj.statusCode = error?.statusCode || 500;
    }

    console.error("[Upload Proxy Error]", {
      target,
      method,
      error: error?.message,
      statusCode: error?.statusCode,
    });

    return {
      error: true,
      url: target,
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage,
      message: error?.message || "Upload proxy failed",
    };
  }
});
