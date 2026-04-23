/**
 * Side-effect entry for <lesson-audio>.
 * Import this module (or use the "lesson-audio" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { LessonAudio } from "../lesson/lesson-audio.js";

defineOnce("lesson-audio", LessonAudio);

export { LessonAudio };
