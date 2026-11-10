import { GufoApi } from "../../core/api";
import { Controller } from "../../core/controller";
import "../../core/bridge";
import { GUFO_URL } from "../../config";
import { overwolfPlatform } from "../../platform/overwolf";

// La fenêtre cachée vit tant que l'app tourne : elle porte le contrôleur.
const controller = new Controller(
  overwolfPlatform(),
  (getToken) => new GufoApi(GUFO_URL, getToken),
);
window.gufo = controller;
controller.start();
