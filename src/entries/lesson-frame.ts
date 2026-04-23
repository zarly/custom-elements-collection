/**
 * Side-effect entry for <lesson-frame>.
 * Import this module (or use the "lesson-frame" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { LessonFrame } from "../lesson/lesson-frame.js";

defineOnce("lesson-frame", LessonFrame);

export { LessonFrame };
