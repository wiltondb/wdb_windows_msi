import { path } from "../deps.js";

export default async (wixDir, descriptor) => {
  console.log("Bundling installer ...");
  const name = descriptor.substring(0, descriptor.length - 4);

  const codeCandle = await Deno.run({
    cmd: [
      path.join(wixDir, "bin/candle.exe"),
      "-nologo",
      "-arch",
      "x64",
      "-o",
      `${name}.wixobj`,
      descriptor,
    ],
  }).status();

  if (0 !== codeCandle.code) {
    throw new Error(`Installer compiler error, code: [${codeCandle.code}]`);
  }

  const codeLight = await Deno.run({
    cmd: [
      path.join(wixDir, "bin/light.exe"),
      "-nologo",
      "-sw1076",
      "-ext",
      "WixUIExtension",
      "-ext",
      "WixUtilExtension",
      "-sval",
      "-cultures:en-US",
      "-o",
      `${name}.msi`,
      `${name}.wixobj`,
    ],
  }).status();

  if (0 !== codeLight.code) {
    throw new Error(`Installer linker error, code: [${codeLight.code}]`);
  }

  return `${name}.msi`;
};
