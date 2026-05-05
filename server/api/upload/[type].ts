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
  const req = (event as any).node?.req || (event as any).req;
  const resObj = (event as any).node?.res || (event as any).res;

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
  } catch (err: any) {
    if (resObj) {
      resObj.statusCode = err?.statusCode || 500;
    }

    console.error("[Upload Proxy Error]", {
      target,
      method,
      error: err?.message,
      statusCode: err?.statusCode,
    });

    return {
      error: true,
      url: target,
      statusCode: err?.statusCode || 500,
      statusMessage: err?.statusMessage,
      message: err?.message || "Upload proxy failed",
    };
  }
});
