import { FOUCManager } from "../utils/loading";

export class PostFilterManager {
    private isEnglish: boolean = false;
    private selectedTags: Set<string> = new Set();
    private filterLogic: "AND" | "OR" = "AND";
    private currentSortField: string = "id";
    private currentSortOrder: string = "asc";
    private currentDifficulty: string = "all";
    private categoryParam: string | null = null;

    private textSearch: HTMLInputElement | null;
    private postList: HTMLElement | null;
    private rows: NodeListOf<HTMLElement>;
    private noResults: HTMLElement | null;
    private resultCount: HTMLElement | null;

    constructor() {
        this.textSearch = document.getElementById("text-search") as HTMLInputElement;
        this.postList = document.getElementById("post-list");
        this.rows = this.postList?.querySelectorAll(".file-row") as NodeListOf<HTMLElement>;
        this.noResults = document.getElementById("no-results");
        this.resultCount = document.getElementById("result-count");

        // URL Params
        const urlParams = new URLSearchParams(window.location.search);
        this.categoryParam = urlParams.get("category");
        const q = urlParams.get("q");

        // --- Category Reset Logic ---
        // We do this BEFORE init so init reads the reset (default) values
        const currentCategory = this.categoryParam || 'default';
        const lastCategory = localStorage.getItem('lastCategory');

        if (lastCategory && lastCategory !== currentCategory) {
            // Category changed, reset persistent filters
            localStorage.removeItem('tagPreference');
            localStorage.setItem('difficultyPreference', 'all');
            // We don't strictly need to reset sort, but usually keeping sort is fine.
            // Resetting search (q) is handled by the fact that URL is new, but if we had persisted search, we'd reset it too.

            // Note: SettingsManager might have cached values if it was initialized earlier, 
            // but since we page reloaded, it should be fresh.
        }
        localStorage.setItem('lastCategory', currentCategory);
        // -----------------------------

        if (q && this.textSearch) {
            this.textSearch.value = q;
        }

        // Fallback: Ensure loading state is removed eventually even if something fails
        FOUCManager.createSafetyNet('#post-list, .filter-bar');

        this.init();
    }

    private init() {
        // --- 0. UI Visibility based on Category ---
        const diffContainer = document.getElementById('difficulty-dropdown-container');
        if (this.categoryParam === 'zerojudge') {
            if (diffContainer) diffContainer.style.display = 'none';
        } else {
            if (diffContainer) diffContainer.style.display = ''; // Restore default (flex/block)
        }
        // ------------------------------------------

        // Init Lang
        this.isEnglish = localStorage.getItem("isEnglish") === "true";

        // Init Sort
        const savedSort = localStorage.getItem("sortPreference");
        if (savedSort) {
            const [field, order] = savedSort.split('-');
            if (field && order) {
                this.currentSortField = field;
                this.currentSortOrder = order;
            }
        }

        // Init Difficulty
        const savedDiff = localStorage.getItem("difficultyPreference");
        if (savedDiff) {
            this.currentDifficulty = savedDiff;
        }

        // Init Tags
        const savedTagPref = localStorage.getItem("tagPreference");
        if (savedTagPref) {
            try {
                const parsed = JSON.parse(savedTagPref);
                const tags = Array.isArray(parsed?.tags) ? parsed.tags : [];
                const logic = parsed?.logic || 'AND';

                this.selectedTags = new Set(tags);
                this.filterLogic = logic;
            } catch (e) {
                console.warn("Failed to parse tag preference", e);
            }
        }

        // Listeners
        document.addEventListener("language-change", (e: any) => {
            this.isEnglish = e.detail.isEnglish;
            this.updateFilter();
        });
        this.textSearch?.addEventListener("input", () => this.updateFilter());

        // Custom Events
        document.addEventListener("tag-filter-change", (e: any) => {
            this.selectedTags = new Set(e.detail.selectedTags);
            if (e.detail.logic) this.filterLogic = e.detail.logic;
            this.updateFilter();
        });

        document.addEventListener("difficulty-change", (e: any) => {
            this.currentDifficulty = e.detail.value;
            this.updateFilter();
        });

        document.addEventListener("sort-change", (e: any) => {
            this.currentSortField = e.detail.field;
            this.currentSortOrder = e.detail.order;
            this.updateSort();
        });

        // Dropdown Mutex (Global click)
        const dropdownBtns = document.querySelectorAll('.dropdown-btn');
        const dropdownMenus = document.querySelectorAll('.dropdown-menu');

        document.addEventListener('click', (e) => {
            const target = e.target as Node;
            let isInsideDropdown = false;
            document.querySelectorAll('.dropdown-container').forEach(container => {
                if (container.contains(target)) isInsideDropdown = true;
            });

            if (!isInsideDropdown) {
                dropdownMenus.forEach(menu => menu.classList.remove('show'));
            }
        });

        dropdownBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clickedBtn = e.currentTarget;
                dropdownMenus.forEach(menu => {
                    const container = menu.closest('.dropdown-container');
                    const btnInContainer = container?.querySelector('.dropdown-btn');
                    if (btnInContainer !== clickedBtn) {
                        menu.classList.remove('show');
                    }
                });
            });
        });


        // Initial run
        this.updateFilter();
    }



    private updateFilter() {
        if (!this.rows) return;
        const term = this.textSearch?.value.toLowerCase() || "";
        let visibleCount = 0;

        this.rows.forEach((row) => {
            const rowTags = (row.dataset.tagsCn || "").split(",");
            const searchContent = row.dataset.search || "";
            const rowDifficulty = row.dataset.difficulty;
            const rowCategory = row.dataset.category;

            // 0. Category
            let targetCategory = this.categoryParam;
            if (!targetCategory) {
                targetCategory = "leetcode"; // Default to LeetCode
            }
            let matchCategory = rowCategory === targetCategory;

            // 1. Difficulty
            let matchDifficulty = true;
            if (this.currentDifficulty !== "all") {
                // Ensure robustness against casing (e.g. Easy vs easy)
                const currentDiff = (this.currentDifficulty || "").toLowerCase();
                const currentRowDiff = (rowDifficulty || "").toLowerCase();
                matchDifficulty = currentRowDiff === currentDiff;
            }

            // 2. Tags
            let matchTags = true;
            if (this.selectedTags.size > 0) {
                if (this.filterLogic === "OR") {
                    matchTags = Array.from(this.selectedTags).some((t) => rowTags.includes(t));
                } else {
                    matchTags = Array.from(this.selectedTags).every((t) => rowTags.includes(t));
                }
            }

            // 3. Text
            const matchText = searchContent.includes(term);

            if (matchTags && matchText && matchDifficulty && matchCategory) {
                row.style.display = "grid";
                visibleCount++;
            } else {
                row.style.display = "none";
            }
        });

        if (this.noResults && this.resultCount) {
            this.noResults.style.display = visibleCount === 0 ? "block" : "none";
            // Check current lang for "Total X posts" format? 
            // Better to use data-cn/data-en on the separate parts of the string in HTML if possible.
            // Or just keep simple for now. 
            // "共 X 篇" -> "Total X posts"
            // The HTML structure is `共 {sortedPosts.length} 篇`. It's mixed text/variable.
            // Let's rely on setLanguage() to swap the static parts if we split them?
            // But here we set textContent directly.
            // Simple fix: check isEnglish here.
            this.resultCount.textContent = this.isEnglish
                ? `Total ${visibleCount} posts`
                : `共 ${visibleCount} 篇`;
        }

        this.updateSort();

        // Remove loading state after first update
        FOUCManager.reveal("#post-list");
        FOUCManager.reveal(".filter-bar");
    }

    private updateSort() {
        if (!this.postList) return;

        const visibleRows = Array.from(this.rows).filter(
            (row) => row.style.display !== "none"
        );

        visibleRows.sort((a, b) => {
            let aVal: string | number | undefined = a.dataset[this.currentSortField];
            let bVal: string | number | undefined = b.dataset[this.currentSortField];

            // If sorting by ID (which can be alphabetic), handle correctly
            if (this.currentSortField === 'id') {
                const numA = Number(aVal);
                const numB = Number(bVal);
                const isNumA = !isNaN(numA);
                const isNumB = !isNaN(numB);

                if (isNumA && isNumB) {
                    // numeric compare
                    return this.currentSortOrder === "asc" ? numA - numB : numB - numA;
                }
                // string compare
                if (!aVal) aVal = "";
                if (!bVal) bVal = "";
                return this.currentSortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }

            // Default numeric sort (date)
            aVal = Number(aVal);
            bVal = Number(bVal);

            if (this.currentSortOrder === "asc") {
                return aVal - bVal;
            } else {
                return bVal - aVal;
            }
        });

        visibleRows.forEach((row) => this.postList?.appendChild(row));
    }
}

export function initFilterSystem() {
    new PostFilterManager();
}
