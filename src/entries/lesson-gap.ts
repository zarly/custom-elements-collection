/**
 * Side-effect entry for <lesson-gap>.
 * Import this module (or use the "lesson-gap" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { LessonGap } from "../lesson/lesson-gap.js";

defineOnce("lesson-gap", LessonGap);

export { LessonGap };
