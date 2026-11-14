import { storage } from './storage';
import { STORAGE_KEYS } from '../constants';

export type SettingType = 'boolean' | 'color' | 'range' | 'text';
export type SettingValue = string | number | boolean | null;

export interface SettingConfig {
    key: string;            // localStorage key
    type: SettingType;      // Type of setting
    defaultValue: SettingValue; // Default value
    cssClass?: string;      // Class to toggle on <html> (for booleans)
    cssVar?: string;        // CSS variable to set (for colors/ranges)
    onApply?: (value: SettingValue) => void; // Custom apply logic
}

// 外觀設定的唯一定義：SettingIcon 用它註冊，Layout 的防閃爍 inline script 也讀同一份
// （經 define:vars 傳入），預設值與 class 名稱不會再各寫一份。
export const APPEARANCE_SETTINGS: SettingConfig[] = [
    { key: STORAGE_KEYS.hoverGlowEnabled, type: 'boolean', defaultValue: true, cssClass: 'hover-glow-enabled' },
    { key: STORAGE_KEYS.spotlightEnabled, type: 'boolean', defaultValue: false, cssClass: 'spotlight-enabled' },
    { key: STORAGE_KEYS.customAccentColor, type: 'color', defaultValue: null, cssVar: '--color-accent-fg' },
];

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
    get(key: string): SettingValue {
        const config = this.configs.get(key);
        if (!config) return null;

        const stored = storage.getItem(key);
        if (stored === null) return config.defaultValue;

        if (config.type === 'boolean') return stored === 'true';
        if (config.type === 'range') return Number.isFinite(Number(stored)) ? Number(stored) : config.defaultValue;
        if (config.type === 'color' && !/^#[a-fA-F0-9]{6}$/.test(stored)) return config.defaultValue;

        return stored;
    }

    /**
     * Set value, save to localStorage, and apply effects
     */
    set(key: string, value: SettingValue) {
        const config = this.configs.get(key);
        if (!config) return;

        const persisted = storage.setItem(key, String(value));

        this.apply(key, value);
        return persisted;
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
    private apply(key: string, value: SettingValue) {
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

        storage.removeItem(key);
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
