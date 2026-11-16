import { NextRequest, NextResponse } from "next/server";

const backendUrl = "https://api.provplay.com";

type ProxyOptions = {
  csrfToken?: string;
};

export async function proxyAdminRequest(request: NextRequest, backendPath: string, options: ProxyOptions = {}) {
  const url = new URL(`${backendUrl.replace(/\/$/, "")}${backendPath}`);
  request.nextUrl.searchParams.forEach((value, key) => url.searchParams.append(key, value));

  try {
    const headers = new Headers({
      accept: "application/json",
      cookie: request.headers.get("cookie") ?? "",
    });
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    const csrfToken = options.csrfToken ?? request.headers.get("x-csrf-token");
    if (csrfToken) headers.set("x-csrf-token", csrfToken);

    const method = request.method.toUpperCase();
    const response = await fetch(url, {
      method,
      headers,
      body: ["GET", "HEAD"].includes(method) ? undefined : await request.text(),
      cache: "no-store",
    });
    const body = await response.text();
    const result = new NextResponse(body, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
    });
    for (const cookie of response.headers.getSetCookie()) result.headers.append("set-cookie", cookie);
    return result;
  } catch {
    return NextResponse.json({ success: false, error: { code: "ADMIN_API_UNAVAILABLE", message: "The ProvPlay backend is unavailable." } }, { status: 503 });
  }
}

export function proxyAdminGet(request: NextRequest, backendPath: string) {
  return proxyAdminRequest(request, backendPath);
}
