import fetch, { RequestInit } from "node-fetch";
import { Proxy } from "../types/proxy.ts";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";

/**
 * Creates an HTTP client with a mimic user-agent header.
 * @param proxy - The proxy configuration.
 * @param userAgent - The User-Agent header to use.
 * @returns A function that acts as a fetch wrapper.
 */
export function createMimicHttpClient(
  proxy: Proxy,
  userAgent: string,
): (url: string, options?: RequestInit) => Promise<Response> {
  return createHttpClient({
    headers: { "User-Agent": userAgent },
    proxy,
    timeout: 5000,
  });
}

/**
 * Creates a general-purpose HTTP client.
 * @param clientConfig - Configuration for the HTTP client.
 * @returns A function that acts as a fetch wrapper.
 */
export function createHttpClient(
  clientConfig: {
    headers?: Record<string, string>;
    proxy?: Proxy;
    timeout?: number;
  } = {},
): (url: string, options?: RequestInit) => Promise<Response> {
  const { proxy, ...config } = clientConfig;

  let agent: any;

  if (proxy) {
    const { protocol, host, port, username, password } = proxy;

    if (protocol === "http" || protocol === "https") {
      // Use HTTPS Proxy Agent for HTTP/HTTPS proxies
      agent = new HttpsProxyAgent({
        host,
        port,
        auth: username && password ? `${username}:${password}` : undefined,
      });
    } else if (protocol === "socks4" || protocol === "socks5") {
      // Use SOCKS Proxy Agent for SOCKS4/SOCKS5 proxies
      agent = new SocksProxyAgent({
        hostname: host,
        port,
        userId: username || undefined,
        password: password || undefined,
      });
    } else {
      throw new Error(`Unsupported proxy protocol: ${protocol}`);
    }
  }

  // Return a fetch wrapper function
  return (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...config.headers,
        ...options.headers,
      },
      //timeout: config.timeout,
      agent,
    });
  };
}
