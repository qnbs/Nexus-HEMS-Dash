#!/usr/bin/env node
/**
 * Shared logic for detecting Git merge conflict marker lines in file contents.
 */
const MARKER_LINE = /^(<<<<<<<|=======|>>>>>>>|\|\|\|\|\|\|\|)/;

/**
 * @param {string} text
 * @returns {string[]} marker lines (without file prefix)
 */
export function findConflictMarkerLines(text) {
  return text
    .split('\n')
    .map((line, index) => ({ line, index: index + 1 }))
    .filter(({ line }) => MARKER_LINE.test(line))
    .map(({ line, index }) => `L${index}: ${line}`);
}

/**
 * @param {string} grepOutput git grep output (file:line:content)
 * @param {(file: string) => boolean} allowFile
 * @returns {string[]}
 */
export function parseGitGrepHits(grepOutput, allowFile) {
  return grepOutput
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean)
    .filter((row) => {
      const file = row.split(':')[0] ?? '';
      return allowFile(file);
    });
}
