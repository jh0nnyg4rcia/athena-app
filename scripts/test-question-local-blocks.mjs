import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { embedded, canonical } from './import-reviewed-questions.mjs';
const lessons = JSON.parse(readFileSync('src/data/homologatedSeeds.json', 'utf8'));
for (const lesson of Object.values(lessons)) test(`Fixture local ${lesson.id}: formato inspecionado sem coerção`, () => {
  assert.equal(lesson.blocks.length, 6);
  assert.ok(lesson.blocks.every(b => typeof b === 'string'));
  const b5 = lesson.content.indexOf('[BLOCK_5]'), b6 = lesson.content.indexOf('[BLOCK_6]'), challenge = lesson.content.indexOf('[ATHENA_CHALLENGE]');
  assert.ok(b5 >= 0 && b6 > b5 && challenge >= 0);
  assert.equal(canonical(embedded(lesson.content).challenge), canonical(lesson.challenge));
});
