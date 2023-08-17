import conf from "../conf.js";

export default {
  actions() {
    return [{
      _attributes: {
        Id: "create_cluster_immediate",
        Property: "create_cluster_deferred",
        Value: "&quot;[System64Folder]WindowsPowerShell\\v1.0\\powershell.exe&quot;" +
          " -NoLogo -NoProfile -NonInteractive" +
          " -ExecutionPolicy Bypass" +
          " -File &quot;[INSTALLDIR]share\\installer\\create_cluster.ps1&quot;" +
          " &quot;[INSTALLDIR]&quot;"
      },
    }, {
      _attributes: {
        Id: "create_cluster_deferred",
        BinaryKey: "WixCA",
        DllEntry: "WixQuietExec",
        Return: "check",
        Execute: "deferred",
        Impersonate: "no",
      },
    }];
  },

  executeSequence() {
    return {
      Custom: [{
        _attributes: {
          Action: "create_cluster_immediate",
          Before: "InstallInitialize",
        },
        _cdata: "(NOT Installed) AND (NOT REMOVE)",
      }, {
        _attributes: {
          Action: "create_cluster_deferred",
          Before: "InstallServices",
        },
        _cdata: "(NOT Installed) AND (NOT REMOVE)",
      }],
    };
  },
};
