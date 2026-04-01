/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Markdown 样式优化工具
 */

/**
 * 优化 Markdown 样式：
 * - 标题降级：H1 → H4，H2~H6 → H5
 * - 压缩多余空行（3 个以上连续换行 → 2 个）
 * - 代码块内容不受影响
 */
export function optimizeMarkdownStyle(text: string): string {
  try {
    let r = _optimizeMarkdownStyle(text);
    r = stripInvalidImageKeys(r);
    return r;
  } catch {
    return text;
  }
}

function _optimizeMarkdownStyle(text: string): string {
  // ── 1. 提取代码块，用占位符保护，避免标题降级误伤 ─────────────────
  const MARK = '___CB_';
  const codeBlocks: string[] = [];
  let r = text.replace(/```[\s\S]*?```/g, (m) => {
    return `${MARK}${codeBlocks.push(m) - 1}___`;
  });

  // ── 2. 标题降级 ────────────────────────────────────────────────────
  const hasH1toH3 = /^#{1,3} /m.test(text);
  if (hasH1toH3) {
    r = r.replace(/^#{2,6} (.+)$/gm, '##### $1');
    r = r.replace(/^# (.+)$/gm, '#### $1');
  }

  // ── 3. 还原代码块 ──────────────────────────────────────────────────
  codeBlocks.forEach((block, i) => {
    r = r.replace(`${MARK}${i}___`, block);
  });

  // ── 4. 压缩多余空行（3 个以上连续换行 → 2 个）────────────────────
  r = r.replace(/\n{3,}/g, '\n\n');

  return r;
}

// ---------------------------------------------------------------------------
// stripInvalidImageKeys
// ---------------------------------------------------------------------------

/** Matches complete markdown image syntax: `![alt](value)` */
const IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;

/**
 * Strip `![alt](value)` where value is not a valid Feishu image key
 * (`img_xxx`). Prevents CardKit error 200570.
 *
 * HTTP URLs are stripped as well — ImageResolver should have already
 * replaced them with `img_xxx` keys before this point. This serves
 * as a safety net for any unresolved URLs.
 */
function stripInvalidImageKeys(text: string): string {
  if (!text.includes('![')) return text;
  return text.replace(IMAGE_RE, (fullMatch, _alt, value) => {
    if (value.startsWith('img_')) return fullMatch;
    return ''; // strip all non-img_ image references (URLs, local paths, etc.)
  });
}
