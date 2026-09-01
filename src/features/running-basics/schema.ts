import { z } from 'zod';

export const runningBasicsLocaleSchema = z.enum(['de', 'en', 'fr']);

export const runningBasicsSectionSchema = z.object({
  heading: z.string().trim().min(1),
  paragraphs: z.array(z.string().trim().min(1)).min(1),
  bullets: z.array(z.string().trim().min(1)).optional(),
});

export const runningBasicsTranslationSchema = z.object({
  title: z.string().trim().min(1),
  introduction: z.string().trim().min(1),
  sections: z.array(runningBasicsSectionSchema).min(1),
  callout: z.string().trim().min(1).optional(),
});

export const runningBasicsTopicSchema = z.object({
  order: z.number().int().positive(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  translations: z.object({
    de: runningBasicsTranslationSchema,
    en: runningBasicsTranslationSchema,
    fr: runningBasicsTranslationSchema,
  }),
});

export const runningBasicsTopicFileSchema = z.array(
  runningBasicsTopicSchema.extend({ id: z.string().trim().min(1) }),
);

export type RunningBasicsLocale = z.infer<typeof runningBasicsLocaleSchema>;
export type RunningBasicsTopic = z.infer<typeof runningBasicsTopicSchema> & {
  id: string;
};
