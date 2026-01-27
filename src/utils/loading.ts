export class FOUCManager {
    /**
     * Reveal elements by removing the fouc-loading class.
     * @param target Selector string or HTMLElement
     */
    static reveal(target: string | HTMLElement | null) {
        if (!target) return;

        const elements = typeof target === 'string'
            ? document.querySelectorAll(target)
            : [target];

        elements.forEach(el => {
            if (el instanceof HTMLElement) {
                requestAnimationFrame(() => {
                    el.classList.remove('fouc-loading');
                });
            }
        });
    }

    /**
     * Create a safety timeout to force reveal elements if they haven't been revealed yet.
     * @param selector Selector string
     * @param timeoutMs Timeout in milliseconds (default 1000)
     */
    static createSafetyNet(selector: string, timeoutMs = 1000) {
        setTimeout(() => {
            FOUCManager.reveal(selector);
        }, timeoutMs);
    }
}
