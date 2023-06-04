import { js2xml, path } from "../deps.js";
import conf from "../conf.js";
import createDeclaration from "../descriptor/createDeclaration.js";
import createWix from "../descriptor/createWix.js";

export default async (workDir, distDir) => {
  console.log("Creating installer descriptor ...");
  const descPath = path.join(
    workDir,
    `${conf.msiFileName}_${conf.version}.wxs`,
  );

  // create elements
  const declarationEl = createDeclaration();
  const wixEl = await createWix(distDir);

  // serialize
  const declaration = js2xml(declarationEl, {
    compact: true,
  });
  const wix = js2xml(wixEl, {
    compact: true,
    spaces: 4,
  });
  const xml = `${declaration}\n${wix}`;

  // write
  await Deno.writeTextFile(descPath, xml);

  console.log(`Descriptor written, path: [${descPath}]`);
  return descPath;
};
