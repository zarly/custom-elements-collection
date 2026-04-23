/**
 * Side-effect entry for <lesson-rule>.
 * Import this module (or use the "lesson-rule" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { LessonRule } from "../lesson/lesson-rule.js";

defineOnce("lesson-rule", LessonRule);

export { LessonRule };
