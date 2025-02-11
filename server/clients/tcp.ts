import net, { Socket } from "node:net";
import { Proxy } from "../types/proxy.ts";
import { createAgent } from "../utils/proxy.ts";
export interface SocketConfig {
  host: string;
  port: number;
  timeout: number;
}

const DEFAULT_SOCKET_CONFIG: SocketConfig = {
  host: "127.0.0.1",
  port: 1080,
  timeout: 5000,
};

/**
 * Creates a TCP client using a SOCKS4/5 proxy.
 * @param proxy - The proxy configuration.
 * @param socketConfig - Custom socket configuration.
 * @param callback - A callback to handle the open socket.
 * @returns The created socket.
 */
export function createTcpClient(
  proxy: Proxy,
  socketConfig: Partial<SocketConfig> = {},
  callback?: (socket: Socket) => void,
): Socket {
  if (proxy.protocol !== "socks4" && proxy.protocol !== "socks5") {
    throw new Error(`Unsupported proxy protocol: ${proxy.protocol}`);
  }

  const config = { ...DEFAULT_SOCKET_CONFIG, ...socketConfig };
  const agent = createAgent(proxy);
  const socket = new net.Socket();

  socket.setTimeout(config.timeout);

  socket.connect(
    { host: config.host, port: config.port, gent: proxyAgent },
    () => {
      if (callback) callback(socket);
      socket["open"] = true;
    },
  );

  socket.on("close", () => {
    socket["open"] = false;
  });

  socket.on("timeout", () => {
    socket.destroy();
    socket["open"] = false;
  });

  return socket;
}
