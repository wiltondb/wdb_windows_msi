import { fs, path } from "../deps.js";
import conf from "../conf.js";

async function updateConfFile(dataDir) {
  const confFile = path.join(dataDir, "postgresql.conf");
  const contents = await Deno.readTextFile(confFile);
  const lines = contents.split("\r\n");
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.startsWith("#shared_preload_libraries")) {
      lines[i] = "shared_preload_libraries = 'babelfishpg_tds'";
    } else if (ln.startsWith("#logging_collector = off")) {
      lines[i] = ln.replace("#logging_collector = off", "logging_collector = on");
    } else if (ln.startsWith("#log_directory")) {
      lines[i] = ln.replace("#log_directory", "log_directory");
    } else if (ln.startsWith("#log_filename")) {
      lines[i] = ln.replace("#log_filename", "log_filename");
    } else if (ln.startsWith("#log_rotation_age")) {
      lines[i] = ln.replace("#log_rotation_age", "log_rotation_age");
    }
  }
  const updated = lines.join("\r\n");
  await Deno.writeTextFile(confFile, updated);
}

async function updateHbaFile(dataDir) {
  const hbaFile = path.join(dataDir, "pg_hba.conf");
  const contents = await Deno.readTextFile(hbaFile);
  const lines = contents.split("\r\n");
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.startsWith("host") && ln.endsWith("trust") && !ln.includes("replication")) {
      lines[i] = ln.replace("trust", "md5")
          .replace("127.0.0.1/32", "0.0.0.0/0")
          .replace("::1/128", "::/0");
    }
  }
  const updated = lines.join("\r\n");
  await Deno.writeTextFile(hbaFile, updated);
}

async function runCmd(cmd, bestEffort) {
  console.log(cmd.join(" "));
  const ps = await Deno.run({ cmd }).status();
  if (!bestEffort && 0 !== ps.code) {
    console.log(`ERROR: status code: [${ps.code}]`);
    Deno.exit(1);
  }
}

export default async (bundleDir) => {
  console.log("Creating DB cluster ...");

  const initdbExe = path.join(bundleDir, "bin", "initdb.exe");
  const pgctlExe = path.join(bundleDir, "bin", "pg_ctl.exe");
  const psqlExe = path.join(bundleDir, "bin", "psql.exe");
  const user = Deno.env.get("USERNAME");

  const filePath = path.fromFileUrl(import.meta.url);
  const rootDir = path.dirname(path.dirname(path.dirname(filePath)));
  const init1Sql = path.join(rootDir, "resources", "init_babelfish_1.sql");
  const init2Sql = path.join(rootDir, "resources", "init_babelfish_2.sql");

  const dataDir = path.join(bundleDir, "data");
  await fs.emptyDir(dataDir);

  await runCmd([initdbExe, "-D", dataDir, "-E", "UTF8", "--locale", "en_US.UTF-8"]);
  await updateConfFile(dataDir);
  await fs.emptyDir(path.join(dataDir, "log"));
  await runCmd([pgctlExe, "start", "-D", dataDir]);
  await runCmd([psqlExe, "-U", user, "-d", "postgres", "-f", init1Sql]);
  await runCmd([psqlExe, "-U", user, "-d", "wilton", "-f", init2Sql]);
  await updateHbaFile(dataDir);
  await runCmd([pgctlExe, "stop", "-D", dataDir]);
  await fs.emptyDir(path.join(dataDir, "log"));

  return dataDir;
};
