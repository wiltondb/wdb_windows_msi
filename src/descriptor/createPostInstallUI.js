export default () => {
  return [{
    Publish: {
      _attributes: {
        Dialog: "ExitDialog",
        Control: "Finish",
        Event: "DoAction",
        Value: "postinstall",
      },
      _text: "(NOT REMOVE) AND (WIXUI_EXITDIALOGOPTIONALCHECKBOX = 1)",
    },
  }];
};
