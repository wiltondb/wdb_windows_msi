import { fs, path } from "../deps.js";

export default async () => {
  console.log("Preparing work directory ...");

  const filePath = path.fromFileUrl(import.meta.url);
  const rootDir = path.dirname(path.dirname(path.dirname(filePath)));
  const workDir = path.join(rootDir, "work");

  await fs.emptyDir(workDir);

  return workDir;
};
