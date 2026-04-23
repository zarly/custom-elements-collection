/**
 * Side-effect entry for <lesson-quiz>.
 * Import this module (or use the "lesson-quiz" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { LessonQuiz } from "../lesson/lesson-quiz.js";

defineOnce("lesson-quiz", LessonQuiz);

export { LessonQuiz };
