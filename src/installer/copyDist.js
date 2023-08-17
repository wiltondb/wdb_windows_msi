import { fs, path } from "../deps.js";
import conf from "../conf.js";

export default async (distDir, workDir) => {
  console.log("Preparing dist files ...");

  const filePath = path.fromFileUrl(import.meta.url);
  const rootDir = path.dirname(path.dirname(path.dirname(filePath)));
  const resourcesDir = path.join(rootDir, "resources")
  const bundleDir = path.join(workDir, "dist");
  await fs.emptyDir(bundleDir);

  const join = path.join;
  await fs.copy(join(distDir, "bin"), join(bundleDir, "bin"));
  await fs.copy(join(distDir, "doc"), join(bundleDir, "doc"));
  await fs.copy(join(distDir, "include"), join(bundleDir, "include"));
  await fs.copy(join(distDir, "lib"), join(bundleDir, "lib"));
  await fs.copy(join(distDir, "share"), join(bundleDir, "share"));

  const installerDir = path.join(bundleDir, "share", "installer");
  await fs.emptyDir(installerDir);
  await fs.copy(join(resourcesDir, "create_cluster.ps1"), join(installerDir, "create_cluster.ps1"));
  await fs.copy(join(resourcesDir, "01_alter_system_create_db.sql"), join(installerDir, "01_alter_system_create_db.sql"));
  await fs.copy(join(resourcesDir, "02_create_extension.sql"), join(installerDir, "02_create_extension.sql"));

  return bundleDir;
};
