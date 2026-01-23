import type { CollectionEntry } from "astro:content";
import { LEETCODE_COLLECTION } from "./constants";

export type PostEntry = CollectionEntry<typeof LEETCODE_COLLECTION>;
