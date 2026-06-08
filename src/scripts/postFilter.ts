import { FOUCManager } from "../utils/loading";
import { FilterEngine } from "./filterEngine";
import { SortEngine } from "./sortEngine";
import type { Post, FilterCriteria, SortConfig } from "../types";

export class PostFilterManager {
    private posts: Post[];
    private isEnglish: boolean = false;
    private selectedTags: Set<string> = new Set();
    private filterLogic: "AND" | "OR" = "AND";
    private currentSortField: "id" | "date" = "id";
    private currentSortOrder: "asc" | "desc" = "asc";
    private currentDifficulty: string = "all";
    private categoryParam: string | null = null;

    private textSearch: HTMLInputElement | null;
    private postList: HTMLElement | null;
    private rows: NodeListOf<HTMLElement>;
    private noResults: HTMLElement | null;
    private resultCount: HTMLElement | null;

    private filterEngine = new FilterEngine();
    private sortEngine = new SortEngine();

    constructor(posts: Post[]) {
        this.posts = posts;
        console.log(`[PostFilterManager] Initialized with ${posts.length} posts`);

        this.textSearch = document.getElementById("text-search") as HTMLInputElement;
        this.postList = document.getElementById("post-list");
        this.rows = this.postList?.querySelectorAll(".file-row") as NodeListOf<HTMLElement>;
        this.noResults = document.getElementById("no-results");
        this.resultCount = document.getElementById("result-count");

        console.log(`[PostFilterManager] Found ${this.rows?.length} rows in DOM`);

        // URL Params
        const urlParams = new URLSearchParams(window.location.search);
        this.categoryParam = urlParams.get("category");
        const q = urlParams.get("q");

        // Category Reset Logic
        const currentCategory = this.categoryParam || 'default';
        const lastCategory = localStorage.getItem('lastCategory');

        if (lastCategory && lastCategory !== currentCategory) {
            localStorage.removeItem('tagPreference');
            localStorage.setItem('difficultyPreference', 'all');
        }
        localStorage.setItem('lastCategory', currentCategory);

        if (q && this.textSearch) {
            this.textSearch.value = q;
        }

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
            this.updateLanguage();
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
            this.updateFilter();
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
        if (!this.rows || !this.postList) {
            console.warn("[PostFilterManager] updateFilter: rows or postList is null");
            return;
        }

        const criteria: FilterCriteria = {
            tags: this.selectedTags,
            tagFilterLogic: this.filterLogic,
            difficulty: this.currentDifficulty,
            category: this.categoryParam,
            searchTerm: this.textSearch?.value.toLowerCase() || "",
        };

        const filterResult = this.filterEngine.filter(this.posts, criteria);
        const sortedPosts = this.sortEngine.sort(filterResult.posts, {
            field: this.currentSortField,
            order: this.currentSortOrder,
        });

        this.renderResults(sortedPosts, filterResult.count);

        FOUCManager.reveal("#post-list");
        FOUCManager.reveal(".filter-bar");
    }

    private updateLanguage() {
        // 更新所有標題文字
        this.rows.forEach((row) => {
            const titleSpan = row.querySelector('.title-text');
            if (titleSpan) {
                const cnText = titleSpan.getAttribute('data-cn');
                const enText = titleSpan.getAttribute('data-en');
                if (cnText && enText) {
                    titleSpan.textContent = this.isEnglish ? enText : cnText;
                }
            }
        });

        // 更新日期文字
        this.rows.forEach((row) => {
            const dateDiv = row.querySelector('.col-date');
            if (dateDiv) {
                const cnDate = dateDiv.getAttribute('data-cn');
                const enDate = dateDiv.getAttribute('data-en');
                if (cnDate && enDate) {
                    dateDiv.textContent = this.isEnglish ? enDate : cnDate;
                }
            }
        });
    }

    private renderResults(filteredPosts: Post[], totalCount: number) {
        const visibleIds = new Set(filteredPosts.map(p => p.id));

        // 更新 DOM：顯示/隱藏和排序
        const visibleRows: HTMLElement[] = [];

        this.rows.forEach((row) => {
            const id = row.dataset.postId;
            if (visibleIds.has(id)) {
                row.style.display = "grid";
                visibleRows.push(row);
            } else {
                row.style.display = "none";
            }
        });

        // 按篩選結果順序重新排列可見的行
        filteredPosts.forEach((post) => {
            const row = Array.from(this.rows).find(r => r.dataset.postId === post.id);
            if (row && this.postList) {
                this.postList.appendChild(row);
            }
        });

        // 更新結果計數
        if (this.noResults && this.resultCount) {
            this.noResults.style.display = totalCount === 0 ? "block" : "none";
            this.resultCount.textContent = this.isEnglish
                ? `Total ${totalCount} posts`
                : `共 ${totalCount} 篇`;
        }
    }
}

export function initFilterSystem(posts: Post[]) {
    new PostFilterManager(posts);
}
