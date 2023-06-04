import conf from "../conf.js";

export default {
  actions() {
    return [{
      _attributes: {
        Id: "uninstall_cleanup_immediate",
        Property: "uninstall_cleanup_deferred",
        Value: "&quot;[SystemFolder]cmd.exe&quot; /c" +
          " rd /s /q &quot;[INSTALLDIR]&quot;",
      },
    }, {
      _attributes: {
        Id: "uninstall_cleanup_deferred",
        BinaryKey: "WixCA",
        DllEntry: "WixQuietExec",
        Return: "ignore",
        Execute: "deferred",
        Impersonate: "no",
      },
    }];
  },

  executeSequence() {
    return {
      Custom: [{
        _attributes: {
          Action: "uninstall_cleanup_immediate",
          Before: "InstallInitialize",
        },
        _cdata: "REMOVE AND (NOT UPGRADINGPRODUCTCODE)",
      }, {
        _attributes: {
          Action: "uninstall_cleanup_deferred",
          Before: "InstallFinalize",
        },
        _cdata: "REMOVE AND (NOT UPGRADINGPRODUCTCODE)",
      }],
    };
  },
};
