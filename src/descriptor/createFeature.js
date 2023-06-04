import conf from "../conf.js";

function collectRefsRecursive(refs, dirEl) {
  if (dirEl.Directory) {
    dirEl.Directory.forEach((el) => {
      collectRefsRecursive(refs, el);
    });
  }
  if (dirEl.Component) {
    dirEl.Component.forEach((comp) => {
      refs.push({
        _attributes: {
          Id: comp._attributes.Id,
        },
      });
    });
  }
}

export default (dirEl) => {
  const refs = [];

  collectRefsRecursive(refs, dirEl);

  return {
    _attributes: {
      Id: conf.featureName,
      Absent: "disallow",
      AllowAdvertise: "no",
      ConfigurableDirectory: "INSTALLDIR",
    },
    ComponentRef: refs,
  };
};
