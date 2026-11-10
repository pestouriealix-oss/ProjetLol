import { findController } from "../../core/bridge";
import { WINDOWS } from "../../core/ids";
import { windowControls } from "../../platform/overwolf";
import { mount } from "../../ui/mount";

import { SheetWindow } from "./sheet-window";

const controller = findController();
if (controller) {
  mount(<SheetWindow controller={controller} onDrag={() => windowControls.drag(WINDOWS.inGame)} />);
}
