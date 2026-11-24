import { z } from "zod";
import { findLabelOverflows } from "./svgLabelFit";

// URL-safe name used in addresses and file names
export const SlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lower-case letters, digits and single hyphens only");

// Reports each repeated value (ignoring case and spacing), so a copy-paste slip
// names the exact entry
function noDuplicates(
  values: string[],
  label: string,
  ctx: z.RefinementCtx,
  path: (string | number)[]
) {
  const seen = new Set<string>();
  values.forEach((value, i) => {
    const key = value.trim().toLowerCase();
    if (seen.has(key)) {
      ctx.addIssue({ code: "custom", path: [...path, i], message: `Duplicate ${label}: "${value}"` });
    }
    seen.add(key);
  });
}

// Canonical tag normalizer
export const TagSchema = z
  .string()
  .trim()
  .min(1)
  .transform((tag) => tag.toLowerCase());

export const AITutorSchema = z.strictObject({
  recap: z.string().optional(),
  explain: z.string().optional(),
  review: z.string().optional(),
});

export const GlossaryTermSchema = z.strictObject({
  term: z.string().min(1),
  definition: z.string().min(1),
});

const GlossarySchema = z
  .array(GlossaryTermSchema)
  .superRefine((terms, ctx) =>
    noDuplicates(terms.map((t) => t.term), "glossary term", ctx, [])
  )
  .default([]);

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
export const ReadingWidgetDataSchema = z.strictObject({
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
export const ClozeWidgetDataSchema = z.strictObject({
  prompt: z.string().min(1),
  template: z.string().min(1), // e.g. "An API acts as a {blank} between two applications."
  options: z.array(z.string().min(1)).min(2),
  correctAnswer: z.string().min(1),
  explanation: AnswerExplanationSchema,
  bonusFact: z.string().optional(),
}).superRefine((d, ctx) => {
  const blanks = d.template.split("{blank}").length - 1;
  if (blanks !== 1) {
    ctx.addIssue({
      code: "custom",
      path: ["template"],
      message: `template must contain exactly one {blank} (found ${blanks})`,
    });
  }
  noDuplicates(d.options, "option", ctx, ["options"]);
  const answer = d.correctAnswer.trim().toLowerCase();
  if (!d.options.some((o) => o.trim().toLowerCase() === answer)) {
    ctx.addIssue({
      code: "custom",
      path: ["correctAnswer"],
      message: `correctAnswer "${d.correctAnswer}" is not one of the options`,
    });
  }
});

// 3. Choice Widget (Scenario check)
export const ChoiceWidgetDataSchema = z.strictObject({
  question: z.string().min(1),
  isMultiSelect: z.boolean().default(false),
  options: z
    .array(
      z.strictObject({
        id: z.string().min(1),
        text: z.string().min(1),
      })
    )
    .min(2),
  correctOptionIds: z.array(z.string().min(1)).min(1),
  explanation: AnswerExplanationSchema,
  bonusFact: z.string().optional(),
}).superRefine((d, ctx) => {
  const ids = d.options.map((o) => o.id);
  noDuplicates(ids, "option id", ctx, ["options"]);
  noDuplicates(d.correctOptionIds, "correct option id", ctx, ["correctOptionIds"]);
  d.correctOptionIds.forEach((id, i) => {
    if (!ids.includes(id)) {
      ctx.addIssue({
        code: "custom",
        path: ["correctOptionIds", i],
        message: `correct option "${id}" is not one of the options`,
      });
    }
  });
  if (!d.isMultiSelect && d.correctOptionIds.length !== 1) {
    ctx.addIssue({
      code: "custom",
      path: ["correctOptionIds"],
      message: "a single-select question needs exactly one correct option",
    });
  }
});

// 4. Swipe Deck Widget (True/False cards)
export const SwipeCardSchema = z.strictObject({
  id: z.string().min(1),
  statement: z.string().min(1),
  isTrue: z.boolean(),
  explanation: z.string().min(1),
});

export const SwipeDeckWidgetDataSchema = z.strictObject({
  instruction: z.string().min(1),
  cards: z.array(SwipeCardSchema).min(1),
}).superRefine((d, ctx) =>
  noDuplicates(d.cards.map((c) => c.id), "card id", ctx, ["cards"])
);

// 5. Diagram Explorer Widget
export const DiagramNodeSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  title: z.string().min(1),
  definition: z.string().min(1),
  bonusFact: z.string().optional(),
});

export const DiagramExplorerWidgetDataSchema = z.strictObject({
  instruction: z.string().min(1),
  diagramSvg: LessonSvgSchema,
  nodes: z.array(DiagramNodeSchema).min(1),
  /** Shown in the blue Info panel once every step has been explored */
  completionMessage: z.string().min(1),
  completionBonusFact: z.string().optional(),
}).superRefine((d, ctx) =>
  noDuplicates(d.nodes.map((n) => n.id), "node id", ctx, ["nodes"])
);

// 6. Match Pairs Widget
export const MatchPairSchema = z.strictObject({
  id: z.string().min(1),
  left: z.string().min(1),
  right: z.string().min(1),
});

export const MatchPairsWidgetDataSchema = z.strictObject({
  instruction: z.string().min(1),
  pairs: z.array(MatchPairSchema).min(2),
  explanation: AnswerExplanationSchema,
}).superRefine((d, ctx) => {
  noDuplicates(d.pairs.map((p) => p.id), "pair id", ctx, ["pairs"]);
  // A repeated side makes the match ambiguous
  noDuplicates(d.pairs.map((p) => p.left), "left item", ctx, ["pairs"]);
  noDuplicates(d.pairs.map((p) => p.right), "right item", ctx, ["pairs"]);
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

// One screen shape per widget type, so widgetData must match widgetType
function screenOf<T extends z.infer<typeof WidgetTypeEnum>, D extends z.ZodType>(
  widgetType: T,
  widgetData: D
) {
  return z.strictObject({
    id: z.string().min(1),
    title: z.string().min(1),
    widgetType: z.literal(widgetType),
    aiTutor: AITutorSchema.optional(),
    glossary: GlossarySchema,
    widgetData,
  });
}

export const ScreenSchema = z.discriminatedUnion("widgetType", [
  screenOf("reading", ReadingWidgetDataSchema),
  screenOf("cloze", ClozeWidgetDataSchema),
  screenOf("choice", ChoiceWidgetDataSchema),
  screenOf("swipeDeck", SwipeDeckWidgetDataSchema),
  screenOf("diagramExplorer", DiagramExplorerWidgetDataSchema),
  screenOf("matchPairs", MatchPairsWidgetDataSchema),
]);

// Lesson Schema
export const LessonSchema = z.strictObject({
  slug: SlugSchema,
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
export const ChapterSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  lessons: z
    .array(
      z.strictObject({
        slug: SlugSchema,
        title: z.string().min(1),
      })
    )
    .min(1),
});

// Course Schema
export const CourseSchema = z.strictObject({
  slug: SlugSchema,
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
}).superRefine((course, ctx) => {
  noDuplicates(course.chapters.map((c) => c.id), "chapter id", ctx, ["chapters"]);
  // Lesson addresses are /courses/<course>/<lesson>, so a repeat would hide a lesson
  noDuplicates(
    course.chapters.flatMap((c) => c.lessons.map((l) => l.slug)),
    "lesson slug",
    ctx,
    ["chapters"]
  );
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
