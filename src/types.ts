import type { CollectionEntry } from "astro:content";
import { LEETCODE_COLLECTION, ZEROJUDGE_COLLECTION } from "./constants";

export type PostEntry = CollectionEntry<typeof LEETCODE_COLLECTION> | CollectionEntry<typeof ZEROJUDGE_COLLECTION>;
