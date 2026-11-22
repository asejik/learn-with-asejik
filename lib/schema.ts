import { z } from "zod";
import { findLabelOverflows } from "./svgLabelFit";

// Canonical tag normalizer
export const TagSchema = z
  .string()
  .trim()
  .min(1)
  .transform((tag) => tag.toLowerCase());

export const AITutorSchema = z.object({
  recap: z.string().optional(),
  explain: z.string().optional(),
  review: z.string().optional(),
});

export const GlossaryTermSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
});

// Lesson diagrams: every label must fit inside its shape with padding
export const LessonSvgSchema = z
  .string()
  .min(1)
  .superRefine((svg, ctx) => {
    for (const problem of findLabelOverflows(svg)) {
      ctx.addIssue({ code: "custom", message: `Diagram label check: ${problem}` });
    }
  });

// 1. Reading Widget
export const ReadingWidgetDataSchema = z.object({
  paragraphs: z.array(z.string().min(1)),
  svgIllustration: LessonSvgSchema.optional(),
  audioClip: z
    .object({
      url: z.string().min(1),
      durationSeconds: z.number().optional(),
      label: z.string().optional(),
    })
    .optional(),
});

// Answer explanations are shown whether the learner was right or wrong; the
// feedback panel heading gives the verdict. So they must not open with one.
// A verdict is the word followed by punctuation ("Correct!", "Not quite:"),
// so sentences like "Wrong credentials return 401" are still allowed.
const VERDICT_OPENING =
  /^\s*(correct|incorrect|exactly|wrong|spot\s+on|well\s+done|not\s+quite|that['’]s\s+right|that['’]s\s+wrong)\s*[!.,:;—–-]/i;

export const AnswerExplanationSchema = z
  .string()
  .min(1)
  .refine((text) => !VERDICT_OPENING.test(text), {
    message:
      'Answer explanations must not start with a verdict such as "Correct!": the same text is shown after a wrong answer.',
  });

// 2. Cloze Widget (Fill-in-the-blank)
export const ClozeWidgetDataSchema = z.object({
  prompt: z.string().min(1),
  template: z.string().min(1), // e.g. "An API acts as a {blank} between two applications."
  options: z.array(z.string().min(1)).min(2),
  correctAnswer: z.string().min(1),
  explanation: AnswerExplanationSchema,
  bonusFact: z.string().optional(),
});

// 3. Choice Widget (Scenario check)
export const ChoiceWidgetDataSchema = z.object({
  question: z.string().min(1),
  isMultiSelect: z.boolean().default(false),
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1),
      })
    )
    .min(2),
  correctOptionIds: z.array(z.string().min(1)).min(1),
  explanation: AnswerExplanationSchema,
  bonusFact: z.string().optional(),
});

// 4. Swipe Deck Widget (True/False cards)
export const SwipeCardSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  isTrue: z.boolean(),
  explanation: z.string().min(1),
});

export const SwipeDeckWidgetDataSchema = z.object({
  instruction: z.string().min(1),
  cards: z.array(SwipeCardSchema).min(1),
});

// 5. Diagram Explorer Widget
export const DiagramNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  title: z.string().min(1),
  definition: z.string().min(1),
  bonusFact: z.string().optional(),
});

export const DiagramExplorerWidgetDataSchema = z.object({
  instruction: z.string().min(1),
  diagramSvg: LessonSvgSchema,
  nodes: z.array(DiagramNodeSchema).min(1),
  /** Shown in the blue Info panel once every step has been explored */
  completionMessage: z.string().min(1),
  completionBonusFact: z.string().optional(),
});

// 6. Match Pairs Widget
export const MatchPairSchema = z.object({
  id: z.string().min(1),
  left: z.string().min(1),
  right: z.string().min(1),
});

export const MatchPairsWidgetDataSchema = z.object({
  instruction: z.string().min(1),
  pairs: z.array(MatchPairSchema).min(2),
  explanation: AnswerExplanationSchema,
});

// Widget Discriminated Union
export const WidgetTypeEnum = z.enum([
  "reading",
  "cloze",
  "choice",
  "swipeDeck",
  "diagramExplorer",
  "matchPairs",
]);

export const ScreenSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  widgetType: WidgetTypeEnum,
  aiTutor: AITutorSchema.optional(),
  glossary: z.array(GlossaryTermSchema).default([]),
  widgetData: z.union([
    ReadingWidgetDataSchema,
    ClozeWidgetDataSchema,
    ChoiceWidgetDataSchema,
    SwipeDeckWidgetDataSchema,
    DiagramExplorerWidgetDataSchema,
    MatchPairsWidgetDataSchema,
  ]),
});

// Lesson Schema
export const LessonSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  chapterId: z.string().optional(),
  keyTerms: z.array(z.string()).default([]),
  screens: z
    .array(ScreenSchema)
    .min(1)
    .refine(
      (screens) => {
        const ids = screens.map((s) => s.id);
        return new Set(ids).size === ids.length;
      },
      { message: "All screen IDs within a lesson must be unique" }
    ),
});

// Chapter Schema
export const ChapterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  lessons: z
    .array(
      z.object({
        slug: z.string().min(1),
        title: z.string().min(1),
      })
    )
    .min(1),
});

// Course Schema
export const CourseSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z
    .string()
    .max(140, "Course summary must be 140 characters or fewer to prevent truncation"),
  mode: z.enum(["tutorial", "course"]),
  estimatedMinutes: z.number().int().positive(),
  approxKbSize: z.number().int().positive(),
  canonicalTags: z
    .array(TagSchema)
    .min(1)
    .refine(
      (tags) => new Set(tags).size === tags.length,
      { message: "Duplicate canonical tags are not permitted" }
    ),
  chapters: z.array(ChapterSchema).min(1),
});

// Exported TypeScript Types inferred from Zod schemas
export type Course = z.infer<typeof CourseSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Screen = z.infer<typeof ScreenSchema>;
export type WidgetType = z.infer<typeof WidgetTypeEnum>;

export type ReadingWidgetData = z.infer<typeof ReadingWidgetDataSchema>;
export type ClozeWidgetData = z.infer<typeof ClozeWidgetDataSchema>;
export type ChoiceWidgetData = z.infer<typeof ChoiceWidgetDataSchema>;
export type SwipeDeckWidgetData = z.infer<typeof SwipeDeckWidgetDataSchema>;
export type DiagramExplorerWidgetData = z.infer<typeof DiagramExplorerWidgetDataSchema>;
export type MatchPairsWidgetData = z.infer<typeof MatchPairsWidgetDataSchema>;
export type AITutorNotes = z.infer<typeof AITutorSchema>;
export type GlossaryTerm = z.infer<typeof GlossaryTermSchema>;
