export function joinPath(...paths: string[]): string {
  return paths.join("/");
}

export function currentPath(): string {
  return Deno.cwd();
}
export async function loadProxies(): Promise<any[]> {
  const proxiesText = await Deno.readTextFile(
    joinPath(currentPath(), "data/proxies.txt"),
  );

  const authProxiesRegEx = new RegExp(
    /^(http|https|socks4|socks5):\/\/(\S+:\S+)@((\w+|\d+\.\d+\.\d+\.\d+):\d+)$/,
    "g",
  );

  return proxiesText
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const [protocol, loginInfo] = line.split("://");

      if (authProxiesRegEx.test(line)) {
        const [auth, addr] = loginInfo.split("@");
        const [username, password] = auth.split(":");
        const [host, port] = addr.split(":");

        return {
          protocol,
          host,
          port: parseInt(port),
          username,
          password,
        };
      } else {
        const [host, port] = loginInfo.split(":");

        return {
          protocol,
          host,
          port: parseInt(port),
          username: undefined,
          password: undefined,
        };
      }
    });
}
