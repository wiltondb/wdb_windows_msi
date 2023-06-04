import createMsiInstaller from "./src/installer/createMsiInstaller.js";

if (import.meta.main) {
  if (1 !== Deno.args.length) {
    console.log(
      "ERROR: path to dist directory must be specified as the first and only argument",
    );
    Deno.exit(1);
  }
  await createMsiInstaller(Deno.args[0]);
}
