import assert from "node:assert/strict";
import test from "node:test";

import { isGameCompleteForTarget } from "./live-score-rules";

test("11-point games require a two-point lead", () => {
  assert.equal(isGameCompleteForTarget(10, 10, 11), false);
  assert.equal(isGameCompleteForTarget(11, 10, 11), true);
  assert.equal(isGameCompleteForTarget(10, 11, 11), true);
  assert.equal(isGameCompleteForTarget(10, 9, 11), false);
});

test("21-point games require a two-point lead at game point", () => {
  assert.equal(isGameCompleteForTarget(20, 20, 21), false);
  assert.equal(isGameCompleteForTarget(21, 20, 21), true);
  assert.equal(isGameCompleteForTarget(20, 21, 21), true);
  assert.equal(isGameCompleteForTarget(21, 19, 21), false);
});
