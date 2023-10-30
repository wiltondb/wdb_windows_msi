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
  }, {
    _attributes: {
      Id: "WIXUI_EXITDIALOGOPTIONALCHECKBOXTEXT",
      Value: "Open WiltonDB Configuration Tool",
    },
  }, {
    _attributes: {
      Id: "WIXUI_EXITDIALOGOPTIONALCHECKBOX",
      Value: "1",
    },
  }];
};
