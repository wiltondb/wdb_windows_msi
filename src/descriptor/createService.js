import conf from "../conf.js";
import genId from "./genId.js";

export default {
  install() {
    return {
      _attributes: {
        Id: genId(),
        Type: "ownProcess",
        Vital: "yes",
        Name: conf.serviceName,
        DisplayName: conf.serviceDisplayName,
        Description: conf.serviceDescription,
        Start: "auto",
        Account: "LocalSystem",
        ErrorControl: "ignore",
        Interactive: "no",
        Arguments: "runservice" +
          ` -N ${conf.serviceName}` +
          ' -D "[INSTALLDIR]data"' +
          " -w",
      },
    };
  },

  control() {
    return {
      _attributes: {
        Id: genId(),
        Name: conf.serviceName,
        Start: "install",
        Stop: "uninstall",
        Remove: "uninstall",
        Wait: "yes",
      },
    };
  },
};
