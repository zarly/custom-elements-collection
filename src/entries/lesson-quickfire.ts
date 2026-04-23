/**
 * Side-effect entry for <lesson-quickfire>.
 * Import this module (or use the "lesson-quickfire" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { LessonQuickfire } from "../lesson/lesson-quickfire.js";

defineOnce("lesson-quickfire", LessonQuickfire);

export { LessonQuickfire };
