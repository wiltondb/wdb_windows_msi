import { path } from "../deps.js";
import conf from "../conf.js";
import createDirectory from "./createDirectory.js";
import createFeature from "./createFeature.js";
import createCustomActions from "./createCustomActions.js";
import createProperty from "./createProperty.js";
import createWixVariable from "./createWixVariable.js";

function xmlnsAttrs() {
  const res = {};
  res["xmlns"] = "http://schemas.microsoft.com/wix/2006/wi";
  res["xmlns:util"] = "http://schemas.microsoft.com/wix/UtilExtension";
  return res;
}

export default async (distDir) => {
  const filePath = path.fromFileUrl(import.meta.url);
  const rootDir = path.dirname(path.dirname(path.dirname(filePath)));
  const dirEl = await createDirectory(distDir);
  return {
    Wix: {
      _attributes: xmlnsAttrs(),
      Product: {
        _attributes: {
          Id: crypto.randomUUID(),
          Codepage: "1252",
          Language: "1033",
          Manufacturer: conf.manufacturer,
          Name: conf.productName,
          UpgradeCode: conf.upgradeCode,
          Version: conf.version,
        },
        Package: {
          _attributes: {
            Compressed: "yes",
            InstallerVersion: "200",
            InstallScope: "perMachine",
            Languages: "1033",
            Platform: "x64",
            SummaryCodepage: "1252",
          },
        },
        Media: {
          _attributes: {
            Id: "1",
            Cabinet: "Application.cab",
            EmbedCab: "yes",
          },
        },
        Directory: dirEl,
        Feature: createFeature(dirEl),
        CustomAction: createCustomActions.actions(),
        InstallExecuteSequence: createCustomActions.executeSequence(),
        Property: createProperty(),
        UIRef: [{
          _attributes: {
            Id: "WixUI_InstallDir",
          },
        }, {
          _attributes: {
            Id: "WixUI_ErrorProgressText",
          },
        }],
        Icon: {
          _attributes: {
            Id: "icon.exe",
            SourceFile: path.join(rootDir, "resources", "icon.ico"),
          },
        },
        MajorUpgrade: {
          _attributes: {
            AllowDowngrades: "no",
            AllowSameVersionUpgrades: "yes",
            DowngradeErrorMessage:
              "A later version of [ProductName] is already installed. Setup will now exit.",
            IgnoreRemoveFailure: "no",
          },
        },
        WixVariable: createWixVariable(),
      },
    },
  };
};
