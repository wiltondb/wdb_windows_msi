import { path } from "../deps.js";
import conf from "../conf.js";
import createService from "./createService.js";
import genId from "./genId.js";

function addService(compEl) {
  compEl.ServiceInstall = createService.install();
  compEl.ServiceControl = createService.control();
}

async function processDirRecursive(dirPath, dirEl) {
  const children = [...Deno.readDirSync(dirPath)];
  for (const ch of children) {
    const chPath = path.join(dirPath, ch.name);
    if (ch.isDirectory) {
      dirEl.Directory.push({
        _attributes: {
          Id: genId(),
          Name: ch.name,
        },
        Directory: [],
        Component: [],
      });
      await processDirRecursive(
        chPath,
        dirEl.Directory[dirEl.Directory.length - 1],
      );
    } else {
      dirEl.Component.push({
        _attributes: {
          Id: genId(),
          Guid: crypto.randomUUID(),
          Win64: "yes",
        },
        File: {
          _attributes: {
            Id: genId(),
            Name: ch.name,
            KeyPath: "yes",
            DiskId: "1",
            Source: chPath,
          },
        },
      });
      if ("pg_ctl.exe" === ch.name) {
        const compEl = dirEl.Component[dirEl.Component.length - 1];
        addService(compEl);
      }
      if ("wdb_config.exe" === ch.name) {
        const compEl = dirEl.Component[dirEl.Component.length - 1];
        compEl.File._attributes.Id = "WDB_CONFIG_EXE_ID";
      }
    }
  }
  if (0 === children.length) {
    dirEl.Component.push({
      _attributes: {
        Id: genId(),
        Guid: crypto.randomUUID(),
        Win64: "yes",
      },
      CreateFolder: {},
    });
  }
}

export default async (distDir) => {
  const installDirEl = {
    _attributes: {
      Id: "INSTALLDIR",
      Name: `${conf.directoryName}-${conf.version}`,
    },
    Directory: [],
    Component: [],
  };

  await processDirRecursive(distDir, installDirEl);

  return {
    _attributes: {
      Id: "TARGETDIR",
      Name: "SourceDir",
    },
    Directory: [{
      _attributes: {
        Id: "ProgramFiles64Folder",
      },
      Directory: [{
        _attributes: {
          Id: genId(),
          Name: conf.manufacturer,
        },
        Directory: [installDirEl],
      }],
    }],
  };
};
