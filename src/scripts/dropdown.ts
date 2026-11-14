// 下拉選單的唯一開關邏輯：<button data-dropdown="選單 id">。
// 點按鈕切換自己的選單並關閉其他；點選單外部全部關閉。
// ponytail: 沒用原生 popover，因為定位要靠 CSS anchor positioning，舊瀏覽器選單會跑位；普及後可整檔刪除。
const menuOf = (button: HTMLElement) => document.getElementById(button.dataset.dropdown!);

document.addEventListener("click", (e) => {
  const target = e.target as Element;
  const clicked = target.closest<HTMLElement>("[data-dropdown]");
  document.querySelectorAll<HTMLElement>("[data-dropdown]").forEach((button) => {
    const menu = menuOf(button);
    if (!menu) return;
    if (button === clicked) menu.classList.toggle("show");
    else if (!menu.contains(target)) menu.classList.remove("show");
  });
});

export const closeDropdown = (menuId: string) => document.getElementById(menuId)?.classList.remove("show");
