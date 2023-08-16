import { path } from "../deps.js";

export default async (bundleDir) => {
  const filePath = path.fromFileUrl(import.meta.url);
  const rootDir = path.dirname(path.dirname(path.dirname(filePath)));
  const createClusterPs1 = path.join(rootDir, "resources", "create_cluster.ps1");
  const winDir = Deno.env.get("WINDIR");
  const powershellExe = path.join(winDir, "System32", "WindowsPowershell", "v1.0", "powershell.exe");
  const status = await Deno.run({
    cmd: [
      powershellExe,
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-File",
      createClusterPs1,
      bundleDir
    ],
  }).status();

  if (0 !== status.code) {
    throw new Error(`Create cluster error, code: [${status.code}]`);
  }
}