// The Word You'd Delete From the Dictionary — make.fun bounty
// u-puan-the-word-you-d-delete-from-the-dictionary-9e774bc2
//
// The task: submit one word — the single word you would erase from
// the dictionary forever, with nothing else attached. A judge model
// compares entries two at a time and picks the funnier deletion,
// weighing how fast the joke lands, how much of it comes from the
// word itself, and how fresh the pick is.
//
// The program writes that single word to /output/entry.txt, where a
// sealed scorer gates it (1-77 UTF-8 characters, not only white
// space) and the judge compares it two at a time.
//
// The word. "onomatopoeia": the word for words that sound like what
// they mean — buzz, hiss, pop, sizzle. Delete it and the language
// loses the one word that names its own sound effects, while the
// word itself is the most unpronounceable sound effect of all: a
// twelve-letter tongue-twister that sounds like a magic spell and
// describes exactly what it is doing. The joke lands the moment the
// word is gone — no caption or defence needed — and it comes from
// the word itself: its sound, its self-referential meaning, and the
// gap it would leave. Fresh, too: the field will reach for "moist",
// "panties" or "literally" first; nobody's first instinct is to
// erase the word that lets us talk about words that go buzz.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// The word to erase from the dictionary forever.
const WORD = "onomatopoeia";

// The gate the sealed scorer applies, mirrored here so a bad word
// fails loudly at build time instead of silently at grading time.
const MIN_CHARS = 1;
const MAX_CHARS = 77;

// Where the grader looks for the entry. The sandbox mounts the
// output directory at /output; an ENTRY_OUTPUT_DIR override exists
// only so the program can be exercised locally without root, and
// the grader's run never sets it.
const OUTPUT_DIR = process.env.ENTRY_OUTPUT_DIR ?? "/output";
const OUTPUT_FILE = join(OUTPUT_DIR, "entry.txt");

function isSingleWord(text: string): boolean {
  // Exactly one word: no whitespace anywhere, letters only.
  return /^[A-Za-z]+$/.test(text);
}

// Words the judge's own brief calls out as filler: a word from
// this list would lose to any chosen word, so refuse it outright
// instead of shipping it.
const FILLER_WORDS = new Set([
  "thing",
  "stuff",
  "good",
  "nice",
  "the",
  "word",
  "interesting",
]);

function validate(word: string): string[] {
  const problems: string[] = [];
  if (FILLER_WORDS.has(word)) {
    problems.push(`word ${JSON.stringify(word)} is a safe filler word`);
  }
  if (word.length < MIN_CHARS) {
    problems.push(`word is empty (needs at least ${MIN_CHARS} character)`);
  }
  if (word.length > MAX_CHARS) {
    problems.push(
      `word is ${word.length} characters, over the ${MAX_CHARS} cap`,
    );
  }
  if (word.trim() !== word || /\s/.test(word)) {
    problems.push("word contains whitespace, so it is not one word");
  }
  if (!isSingleWord(word)) {
    problems.push("word holds characters outside A-Z, so it is not one word");
  }
  if (word !== word.toLowerCase()) {
    problems.push("word is not all lowercase, which the entry does not need");
  }
  return problems;
}

function main(): void {
  const problems = validate(WORD);
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`invalid entry: ${problem}`);
    }
    process.exit(1);
  }

  // --dry-run validates the word against the gate and reports what
  // would be written, without touching the output directory: useful
  // for checking the entry on a machine where /output is not
  // writable, without changing what the graded run writes.
  if (process.argv.includes("--dry-run")) {
    console.log(
      `dry run: entry is valid, would write ${WORD.length}-character entry to ${OUTPUT_FILE}: ${WORD}`,
    );
    return;
  }

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, WORD, "utf8");

  // Read the file back and prove the round trip: the bytes on disk
  // must be exactly the word, with no trailing newline or extra
  // whitespace the gate could count against the 77-character cap.
  const written = readFileSync(OUTPUT_FILE, "utf8");
  if (written !== WORD) {
    console.error(
      `round-trip mismatch: file holds ${JSON.stringify(written)}, expected ${JSON.stringify(WORD)}`,
    );
    process.exit(1);
  }
  if (Buffer.byteLength(written, "utf8") !== WORD.length) {
    console.error("round-trip mismatch: byte length differs from the word");
    process.exit(1);
  }
  console.log(`wrote ${WORD.length}-character entry to ${OUTPUT_FILE}: ${WORD}`);
}

main();
