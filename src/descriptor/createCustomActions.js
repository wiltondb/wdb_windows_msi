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
    }, {
      _attributes: {
        Id: "sanity_check_immediate",
        Property: "sanity_check_deferred",
        Value: "&quot;[INSTALLDIR]bin\\postgres.exe&quot; --version",
      },
    }, {
      _attributes: {
        Id: "sanity_check_deferred",
        BinaryKey: "WixCA",
        DllEntry: "WixQuietExec",
        Return: "check",
        Execute: "deferred",
        Impersonate: "no",
      },
    }];
  },

  /*
        _attributes: {
          Action: "installdir_data_check_immediate",
          Before: "InstallInitialize",
        },
        _cdata: "(NOT Installed) AND (NOT REMOVE)",
      }, {
        _attributes: {
          Action: "installdir_data_check_deferred",
          After: "InstallInitialize",
        },
        _cdata: "(NOT Installed) AND (NOT REMOVE)",
      }, {
  */

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
      }, {
        _attributes: {
          Action: "sanity_check_immediate",
          Before: "InstallInitialize",
        },
        _cdata: "NOT REMOVE",
      }, {
        _attributes: {
          Action: "sanity_check_deferred",
          Before: "InstallServices",
        },
        _cdata: "NOT REMOVE",
      }],
    };
  },
};
