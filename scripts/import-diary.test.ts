import { describe, expect, it } from 'vitest';
import { convert } from './import-diary.mjs';

describe('import-diary convert', () => {
    it('moves the date line and a standalone short title into frontmatter, keeps single newlines', () => {
        expect(convert('﻿2026 / 11 / 13\r\n\r\n異病偵探\r\n\r\n內文\r\n……\r\n……\r\n')).toBe(
            '---\ntitle: "異病偵探"\n---\n\n內文\n……\n……\n',
        );
    });

    it('treats a bracketed first line as the title', () => {
        expect(convert('「甲、乙」\n見信如晤\n')).toBe('---\ntitle: "「甲、乙」"\n---\n\n見信如晤\n');
    });

    it('leaves plain entries without frontmatter and never invents a title', () => {
        expect(convert('2020/10/10 下午1：47\n\n我的名字\n')).toBe('2020/10/10 下午1：47\n\n我的名字\n');
        expect(convert('2025 / 02 / 27\n\n「」\n\n內文\n')).toBe('內文\n');
    });

    it('escapes separator lines so they show as written instead of becoming headings or rules', () => {
        expect(convert('甲\n---\n內容\n---\n\n=====\n丙\n')).toBe('甲\n\\---\n內容\n\\---\n\n\\=====\n丙\n');
    });

    it('turns --- wrapped notes and A/B dialogues into blockquotes, leaving other separators alone', () => {
        expect(convert('前文\n---\nB：快還是慢？\nA：都有。\n---\n後文\n')).toBe(
            '前文\n\n> B：快還是慢？\n> A：都有。\n\n後文\n',
        );
        expect(convert('前文\n\n---\n※ 聯想來自某部影片\n---\n\n後文\n')).toBe('前文\n\n> ※ 聯想來自某部影片\n\n後文\n');
        expect(convert('甲\n---\n一般段落\n---\n乙\n')).toBe('甲\n\\---\n一般段落\n\\---\n乙\n');
    });

    it('keeps files that already have frontmatter untouched', () => {
        expect(convert('---\ntitle: x\n---\n\n內文\n')).toBe('---\ntitle: x\n---\n\n內文\n');
    });
});
