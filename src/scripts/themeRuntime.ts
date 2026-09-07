import { OFFICIAL_THEMES, DEFAULT_THEME_ID } from "../themes";
import { STORAGE_KEYS } from "../constants";
import { parseCustomThemes } from "../utils/theme-validation";
import { storage } from "./storage";

export function applyTheme(id: string): void {
  document.querySelectorAll("[data-theme-id]").forEach((element) => element.remove());
  document.documentElement.classList.remove("light");
  if (id === DEFAULT_THEME_ID) return;

  const official = OFFICIAL_THEMES.find((theme) => theme.id === id);
  if (official?.path) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = official.path;
    link.dataset.themeId = id;
    document.head.appendChild(link);
    document.documentElement.classList.toggle("light", !!official.isLight);
    return;
  }

  const custom = parseCustomThemes(storage.getItem(STORAGE_KEYS.customThemes)).find((theme) => theme.id === id);
  if (custom) {
    const style = document.createElement("style");
    style.textContent = custom.css;
    style.dataset.themeId = id;
    document.head.appendChild(style);
  }
}
