// 腳本端的語言介面：目前語言、變更通知、動態文字。
// 靜態標記用 i18n/ui.ts 的 t()，由 LanguageToggle 統一切換。
import { storage } from "./storage";
import { STORAGE_KEYS, EVENTS } from "../constants";
import { UI_TEXT, type UiKey } from "../i18n/ui";

export const isEnglish = (): boolean => storage.getItem(STORAGE_KEYS.isEnglish) === "true";

export const text = (key: UiKey): string => UI_TEXT[key][isEnglish() ? "en" : "cn"];

export function onLanguageChange(listener: (isEnglish: boolean) => void): void {
  document.addEventListener(EVENTS.languageChange, (e) =>
    listener((e as CustomEvent<{ isEnglish: boolean }>).detail.isEnglish),
  );
}

/** 換掉元素的雙語文字並立即以目前語言顯示。 */
export function setLocalized(el: HTMLElement | null | undefined, cn = "", en = cn): void {
  if (!el) return;
  el.dataset.cn = cn;
  el.dataset.en = en;
  el.textContent = isEnglish() ? en : cn;
}
