import { Proxy, ProxyProtocol } from "../types/proxy.ts";
import { AttackMethod } from "../types/method.ts";
import { SocksProxyAgent } from "socks-proxy-agent";
const DEFAULT_HTTP_PORT = 8080;
const DEFAULT_PROTOCOL: ProxyProtocol = "http";

const COMMON_PORTS: { [port: number]: ProxyProtocol } = {
  80: "http",
  443: "https",
  1080: "socks5",
  1081: "socks4",
  8080: "http",
  8443: "https",
};

const METHODS: { [key in AttackMethod]: ProxyProtocol[] } = {
  http_flood: ["http", "https", "socks4", "socks5"],
  tcp_flood: ["socks4", "socks5"],
};

/**
 * Attempts to infer the protocol based on the port.
 */
function inferProtocol(port: number | undefined): ProxyProtocol {
  if (port !== undefined && COMMON_PORTS[port]) {
    return COMMON_PORTS[port];
  }
  return DEFAULT_PROTOCOL;
}

/**
 * Creates a SocksProxyAgent for SOCKS4/5 proxies.
 * @param proxy - The proxy configuration.
 * @returns A SocksProxyAgent instance.
 */
export function createAgent(proxy: Proxy): SocksProxyAgent {
  if (proxy.protocol !== "socks4" && proxy.protocol !== "socks5") {
    throw new Error(`Unsupported proxy protocol for agent: ${proxy.protocol}`);
  }

  const uri = `${proxy.protocol}://${
    proxy.username && proxy.password
      ? `${proxy.username}:${proxy.password}@`
      : ""
  }${proxy.host}:${proxy.port}`;

  return new SocksProxyAgent(uri);
}

/**
 * Ensures a proxy object is safe and normalized by adding default values if missing.
 */
function normalizeProxy(proxy: Proxy): Proxy {
  const normalizedPort = proxy.port || DEFAULT_HTTP_PORT;
  const normalizedProtocol = proxy.protocol || inferProtocol(normalizedPort);

  return {
    ...proxy,
    port: normalizedPort,
    protocol: normalizedProtocol,
  };
}

/**
 * Filters proxies based on the attack method and ensures safe parsing of proxies.
 */
export function filterProxies(proxies: Proxy[], method: AttackMethod): Proxy[] {
  return proxies
    .map(normalizeProxy)
    .filter((proxy) => METHODS[method].includes(proxy.protocol));
}
