import conf from "../conf.js";

export default () => {
  return [{
    _attributes: {
      Id: "WIXUI_INSTALLDIR",
      Value: "INSTALLDIR",
    },
  }, {
    _attributes: {
      Id: "ARPHELPLINK",
      Value: conf.helpLink,
    },
  }, {
    _attributes: {
      Id: "ARPPRODUCTICON",
      Value: "icon.exe",
    },
  }, {
    _attributes: {
      Id: "MSIRESTARTMANAGERCONTROL",
      Value: "Disable",
    },
  }];
};
