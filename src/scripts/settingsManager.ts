export type SettingType = 'boolean' | 'color' | 'range' | 'select';

export interface SettingConfig {
    key: string;            // localStorage key
    type: SettingType;      // Type of setting
    defaultValue: any;      // Default value
    cssClass?: string;      // Class to toggle on <html> (for booleans)
    cssVar?: string;        // CSS variable to set (for colors/ranges)
    onApply?: (value: any) => void; // Custom apply logic
}

export class SettingsManager {
    private configs: Map<string, SettingConfig>;
    private root: HTMLElement | undefined;

    constructor() {
        this.configs = new Map();
        // Determine root element (handle SSR safely though this runs on client)
        if (typeof document !== 'undefined') {
            this.root = document.documentElement;
        }
    }

    /**
     * Register a new setting configuration
     */
    register(config: SettingConfig) {
        this.configs.set(config.key, config);
        this.apply(config.key, this.get(config.key));
    }

    /**
     * Get value from localStorage or default
     */
    get(key: string): any {
        const config = this.configs.get(key);
        if (!config) return null;

        if (typeof localStorage === 'undefined') return config.defaultValue;

        const stored = localStorage.getItem(key);
        if (stored === null) return config.defaultValue;

        if (config.type === 'boolean') return stored === 'true';
        if (config.type === 'range') return parseFloat(stored);

        return stored;
    }

    /**
     * Set value, save to localStorage, and apply effects
     */
    set(key: string, value: any) {
        const config = this.configs.get(key);
        if (!config) return;

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, String(value));
        }

        this.apply(key, value);
    }

    /**
     * Toggle a boolean setting
     */
    toggle(key: string) {
        const current = this.get(key);
        this.set(key, !current);
        return !current;
    }

    /**
     * Apply the setting's effect to the DOM
     */
    private apply(key: string, value: any) {
        const config = this.configs.get(key);
        if (!config || !this.root) return;

        // 1. Toggle CSS Class
        if (config.cssClass) {
            if (value === true) {
                this.root.classList.add(config.cssClass);
            } else {
                this.root.classList.remove(config.cssClass);
            }
        }

        // 2. Set CSS Variable
        if (config.cssVar) {
            if (value !== null && value !== undefined) {
                this.root.style.setProperty(config.cssVar, String(value));
            } else {
                this.root.style.removeProperty(config.cssVar);
            }
        }

        // 3. Custom Logic
        if (config.onApply) {
            config.onApply(value);
        }
    }

    /**
     * Remove a setting (reset)
     */
    reset(key: string) {
        const config = this.configs.get(key);
        if (!config) return;

        localStorage.removeItem(key);
        this.apply(key, config.defaultValue);
    }
}

// Singleton instance
let instance: SettingsManager;

export function getSettingsManager(): SettingsManager {
    if (!instance) {
        instance = new SettingsManager();
    }
    return instance;
}
