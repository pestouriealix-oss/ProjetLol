import { findController } from "../../core/bridge";
import { WINDOWS } from "../../core/ids";
import { windowControls } from "../../platform/overwolf";
import { mount } from "../../ui/mount";

import { DesktopApp } from "./desktop-app";

const controller = findController();
if (controller) {
  mount(
    <DesktopApp
      controller={controller}
      windowActions={{
        drag: () => windowControls.drag(WINDOWS.desktop),
        minimize: () => windowControls.minimize(WINDOWS.desktop),
        close: () => windowControls.close(WINDOWS.desktop),
      }}
    />,
  );
}
