/**
 * Tests for statusline collision zone avoidance and display width utilities
 *
 * @see https://github.com/ruvnet/claude-flow/issues/985
 *
 * The collision zone is columns 15-25 on the second-to-last line of output.
 * Claude Code writes its internal status (e.g., "7s • 1p") at these absolute
 * terminal coordinates, causing character bleeding if our statusline has
 * content there.
 *
 * Additionally tests display width calculation for proper terminal rendering
 * with emojis, ANSI codes, and wide characters.
 */

import { describe, it, expect } from 'vitest';

/**
 * Get the character at a specific column (0-indexed)
 * Accounts for emoji width (2 columns)
 */
function getCharAtColumn(line: string, col: number): string {
  const stripped = stripAnsi(line);
  let visualCol = 0;

  for (let i = 0; i < stripped.length; i++) {
    if (visualCol === col) {
      return stripped[i];
    }

    // Emojis are typically 2 columns wide
    const charCode = stripped.charCodeAt(i);
    if (charCode > 0x1F000 || (charCode >= 0xD800 && charCode <= 0xDFFF)) {
      visualCol += 2;
    } else {
      visualCol += 1;
    }

    if (visualCol > col) {
      return stripped[i];
    }
  }

  return ' '; // Beyond line length
}

/**
 * Check if the collision zone (cols 15-25) contains only spaces
 */
function isCollisionZoneClear(line: string): boolean {
  const stripped = stripAnsi(line);

  // Simple check: get substring at cols 15-25
  // This is approximate since emojis take 2 columns
  let visualCol = 0;
  let zoneContent = '';

  for (let i = 0; i < stripped.length && visualCol < 26; i++) {
    const char = stripped[i];
    const charCode = char.charCodeAt(0);
    const charWidth = (charCode > 0x1F000 || (charCode >= 0xD800 && charCode <= 0xDFFF)) ? 2 : 1;

    if (visualCol >= 15 && visualCol < 26) {
      zoneContent += char;
    }

    visualCol += charWidth;
  }

  // The zone should be mostly spaces (allow for padding)
  const nonSpaceCount = zoneContent.replace(/\s/g, '').length;
  return nonSpaceCount === 0;
}

describe('Statusline Collision Zone Avoidance', () => {
  it('should have clear collision zone in safe multi-line output', async () => {
    // Import dynamically to avoid build issues
    const { StatuslineGenerator } = await import('../../src/statusline/index.js');

    const generator = new StatuslineGenerator();
    const output = generator.generateSafeStatusline();

    if (!output) {
      // Statusline disabled
      return;
    }

    const lines = output.split('\n');

    // The second-to-last line is the collision zone
    const collisionLineIndex = lines.length - 2;
    if (collisionLineIndex >= 0) {
      const collisionLine = lines[collisionLineIndex];
      expect(isCollisionZoneClear(collisionLine)).toBe(true);
    }
  });

  it('should produce single-line output when requested', async () => {
    const { StatuslineGenerator } = await import('../../src/statusline/index.js');

    const generator = new StatuslineGenerator();
    const output = generator.generateSingleLine();

    if (!output) {
      return;
    }

    // Single-line output should have no newlines
    expect(output.includes('\n')).toBe(false);
  });

  it('should have padding in the collision line', async () => {
    const { StatuslineGenerator } = await import('../../src/statusline/index.js');

    const generator = new StatuslineGenerator();
    const output = generator.generateSafeStatusline();

    if (!output) {
      return;
    }

    const lines = output.split('\n');
    const collisionLineIndex = lines.length - 2;

    if (collisionLineIndex >= 0) {
      const collisionLine = stripAnsi(lines[collisionLineIndex]);

      // The line should start with 🤖 followed by spaces for padding
      // After the emoji (2 cols), there should be at least 24 spaces
      // to push content past column 25 (collision zone is cols 15-25)
      const match = collisionLine.match(/^🤖(\s+)/);
      expect(match).not.toBeNull();

      if (match) {
        // At least 24 spaces after the emoji (emoji is 2 cols, 2+24=26 > 25)
        expect(match[1].length).toBeGreaterThanOrEqual(24);
      }
    }
  });
});

describe('Statusline Output Modes', () => {
  it('should support all output modes', async () => {
    const { StatuslineGenerator } = await import('../../src/statusline/index.js');

    const generator = new StatuslineGenerator();

    // Regular statusline
    const regular = generator.generateStatusline();
    expect(typeof regular).toBe('string');

    // Safe statusline
    const safe = generator.generateSafeStatusline();
    expect(typeof safe).toBe('string');

    // Single line
    const single = generator.generateSingleLine();
    expect(typeof single).toBe('string');

    // JSON
    const json = generator.generateJSON();
    expect(JSON.parse(json)).toBeDefined();

    // Compact JSON
    const compact = generator.generateCompactJSON();
    expect(JSON.parse(compact)).toBeDefined();
  });
});

describe('Display Width Utilities', () => {
  it('should strip ANSI codes correctly', async () => {
    const { stripAnsi } = await import('../../src/statusline/index.js');

    expect(stripAnsi('\x1b[1;31mRed Bold\x1b[0m')).toBe('Red Bold');
    expect(stripAnsi('\x1b[0;32mGreen\x1b[0m normal')).toBe('Green normal');
    expect(stripAnsi('No codes here')).toBe('No codes here');
    expect(stripAnsi('')).toBe('');
  });

  it('should calculate display width for ASCII strings', async () => {
    const { getDisplayWidth } = await import('../../src/statusline/index.js');

    expect(getDisplayWidth('hello')).toBe(5);
    expect(getDisplayWidth('hello world')).toBe(11);
    expect(getDisplayWidth('')).toBe(0);
  });

  it('should calculate display width ignoring ANSI codes', async () => {
    const { getDisplayWidth } = await import('../../src/statusline/index.js');

    // ANSI codes should have 0 display width
    expect(getDisplayWidth('\x1b[1;31mRed\x1b[0m')).toBe(3);
    expect(getDisplayWidth('\x1b[0;32mGreen\x1b[0m normal')).toBe(12);
  });

  it('should calculate display width for emojis as 2 columns', async () => {
    const { getDisplayWidth } = await import('../../src/statusline/index.js');

    // Emojis typically take 2 columns in terminal
    expect(getDisplayWidth('🤖')).toBe(2);
    expect(getDisplayWidth('Hello 🤖')).toBe(8); // 6 + 2
    expect(getDisplayWidth('🤖🧠')).toBe(4); // 2 + 2
  });

  it('should pad strings to target width', async () => {
    const { padToWidth, getDisplayWidth } = await import('../../src/statusline/index.js');

    const padded = padToWidth('Hi', 10);
    expect(getDisplayWidth(padded)).toBe(10);
    expect(padded).toBe('Hi        '); // 8 spaces

    // Right align
    const rightPadded = padToWidth('Hi', 10, ' ', 'right');
    expect(rightPadded).toBe('        Hi');

    // Center align
    const centerPadded = padToWidth('Hi', 10, ' ', 'center');
    expect(centerPadded).toBe('    Hi    ');
  });

  it('should truncate strings to max width', async () => {
    const { truncateToWidth, getDisplayWidth } = await import('../../src/statusline/index.js');

    const truncated = truncateToWidth('Hello World', 8);
    expect(getDisplayWidth(truncated)).toBeLessThanOrEqual(8);
    expect(truncated).toContain('…');

    // Should not truncate if under max
    const notTruncated = truncateToWidth('Hi', 10);
    expect(notTruncated).toBe('Hi');
  });
});

describe('Single Line Output - Character Bleeding Fix', () => {
  it('should produce ASCII-only output by default', async () => {
    const { StatuslineGenerator, stripAnsi } = await import('../../src/statusline/index.js');

    const generator = new StatuslineGenerator();
    const output = generator.generateSingleLine();

    if (!output) return;

    // Strip ANSI and check for emoji characters
    const stripped = stripAnsi(output);

    // Should NOT contain common problematic emojis
    expect(stripped).not.toContain('🤖');
    expect(stripped).not.toContain('🧠');
    expect(stripped).not.toContain('●'); // Unicode bullet can cause issues

    // Should contain ASCII-safe indicators
    expect(stripped).toContain('CF-V3');
    expect(stripped).toContain('D:');
    expect(stripped).toContain('S:');
    expect(stripped).toContain('CVE:');
    expect(stripped).toContain('Int:');
  });

  it('should have no newlines in single-line output', async () => {
    const { StatuslineGenerator } = await import('../../src/statusline/index.js');

    const generator = new StatuslineGenerator();

    // Test default single-line
    const single = generator.generateSingleLine();
    if (single) {
      expect(single.includes('\n')).toBe(false);
    }

    // Test with emoji
    const singleEmoji = generator.generateSingleLineWithEmoji();
    if (singleEmoji) {
      expect(singleEmoji.includes('\n')).toBe(false);
    }

    // Test ASCII-only
    const singleAscii = generator.generateSingleLineAscii();
    if (singleAscii) {
      expect(singleAscii.includes('\n')).toBe(false);
    }
  });

  it('should support no-color mode', async () => {
    const { StatuslineGenerator } = await import('../../src/statusline/index.js');

    const generator = new StatuslineGenerator();
    const output = generator.generateSingleLine(false); // useColor = false

    if (!output) return;

    // Should not contain ANSI escape sequences
    expect(output).not.toContain('\x1b[');
  });

  it('should produce predictable display width for ASCII output', async () => {
    const { StatuslineGenerator, getDisplayWidth } = await import('../../src/statusline/index.js');

    const generator = new StatuslineGenerator();
    const output = generator.generateSingleLineAscii();

    if (!output) return;

    const width = getDisplayWidth(output);

    // ASCII-only output should have predictable width
    // The width should match the string length (since no ANSI codes and no wide chars)
    expect(width).toBe(output.length);
    expect(width).toBeLessThan(100); // Reasonable single-line length
  });
});
