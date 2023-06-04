import { path } from "../deps.js";
import conf from "../conf.js";

export default () => {
  const filePath = path.fromFileUrl(import.meta.url);
  const rootDir = path.dirname(path.dirname(path.dirname(filePath)));
  return [{
    _attributes: {
      Id: "WixUILicenseRtf",
      Value: path.join(rootDir, "resources", "LICENSE.rtf"),
    },
  }, {
    _attributes: {
      Id: "WixUIBannerBmp",
      Value: path.join(rootDir, "resources", "top.bmp"),
    },
  }, {
    _attributes: {
      Id: "WixUIDialogBmp",
      Value: path.join(rootDir, "resources", "greetings.bmp"),
    },
  }];
};
