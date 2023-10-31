/*
 * Copyright 2023, WiltonDB Software
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
