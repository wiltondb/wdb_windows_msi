import { fs, path } from "../deps.js";
import conf from "../conf.js";

export default async (distDir, workDir) => {
  console.log("Preparing dist files ...");

  const bundleDir = path.join(workDir, "dist");
  await fs.emptyDir(bundleDir);

  const join = path.join;
  await fs.copy(join(distDir, "bin"), join(bundleDir, "bin"));
  await fs.copy(join(distDir, "doc"), join(bundleDir, "doc"));
  await fs.copy(join(distDir, "include"), join(bundleDir, "include"));
  await fs.copy(join(distDir, "lib"), join(bundleDir, "lib"));
  await fs.copy(join(distDir, "share"), join(bundleDir, "share"));

  return bundleDir;
};
