import { z } from 'zod';

export const supportedLocales = ['en', 'de', 'fr'] as const;
export const productKinds = [
  'shoe',
  'apparel',
  'sock',
  'vest',
  'accessory',
] as const;
export const verificationStatuses = [
  'verified',
  'derived',
  'fallback',
  'pending',
] as const;

const idSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a lowercase kebab-case ID');

const nullableTextSchema = z.string().trim().min(1).nullable();

export const localizedTextSchema = z.strictObject({
  en: z.string().trim().min(1),
  de: nullableTextSchema,
  fr: nullableTextSchema,
});

export const evidenceSchema = z
  .strictObject({
    status: z.enum(verificationStatuses),
    sourceIds: z.array(idSchema),
    note: z.string().trim().min(1).optional(),
  })
  .superRefine((evidence, context) => {
    if (evidence.status !== 'pending' && evidence.sourceIds.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['sourceIds'],
        message: 'non-pending evidence requires at least one source',
      });
    }
    if (evidence.status === 'pending' && evidence.sourceIds.length > 0) {
      context.addIssue({
        code: 'custom',
        path: ['sourceIds'],
        message: 'pending evidence cannot claim a supporting source',
      });
    }
    if (evidence.status === 'derived' && !evidence.note) {
      context.addIssue({
        code: 'custom',
        path: ['note'],
        message: 'derived evidence must explain how the value was produced',
      });
    }
  });

export const sourceSchema = z.strictObject({
  id: idSchema,
  type: z.enum([
    'manufacturer',
    'retailer-product',
    'retailer-image',
    'legacy-catalogue',
    'legacy-workbook',
    'other',
  ]),
  label: z.string().trim().min(1),
  url: z.url().nullable(),
  checkedAt: z.iso.date().nullable(),
  status: z.enum(verificationStatuses),
  note: z.string().trim().min(1).optional(),
});

export const categorySchema = z.strictObject({
  id: idSchema,
  label: localizedTextSchema,
});

export const imageAssetSchema = z.strictObject({
  id: idSchema,
  role: z.enum(['primary', 'alternate', 'detail']),
  localPath: z.string().trim().min(1).nullable(),
  sourceUrl: z.url().nullable(),
  sourceId: idSchema.nullable(),
  status: z.enum(['verified', 'fallback', 'pending']),
  alt: localizedTextSchema,
});

export function factSchema<T>(valueSchema: z.ZodType<T>) {
  return z
    .strictObject({
      value: z.union([valueSchema, z.null()]),
      evidence: evidenceSchema,
    })
    .superRefine((fact, context) => {
      if (fact.evidence.status === 'pending' && fact.value !== null) {
        context.addIssue({
          code: 'custom',
          path: ['value'],
          message: 'pending facts must have a null value',
        });
      }
      if (fact.evidence.status !== 'pending' && fact.value === null) {
        context.addIssue({
          code: 'custom',
          path: ['value'],
          message: 'non-pending facts require a value',
        });
      }
    });
}

export const millimetreFactSchema = factSchema(
  z.strictObject({
    amount: z.number().min(0).max(100),
    unit: z.literal('mm'),
  }),
);

export const weightFactSchema = factSchema(
  z.strictObject({
    amount: z.number().positive().max(2000),
    unit: z.literal('g'),
    referenceSize: z.string().trim().min(1),
  }),
);

export const stackHeightFactSchema = factSchema(
  z
    .strictObject({
      heel: z.number().min(0).max(100).optional(),
      forefoot: z.number().min(0).max(100).optional(),
      maximum: z.number().min(0).max(100).optional(),
      unit: z.literal('mm'),
    })
    .superRefine((value, context) => {
      const hasPair = value.heel !== undefined && value.forefoot !== undefined;
      const hasMaximum = value.maximum !== undefined;
      if (hasPair === hasMaximum) {
        context.addIssue({
          code: 'custom',
          message:
            'stack height requires either heel and forefoot values or one published maximum',
        });
      }
      if ((value.heel === undefined) !== (value.forefoot === undefined)) {
        context.addIssue({
          code: 'custom',
          message: 'heel and forefoot stack heights must be supplied together',
        });
      }
    }),
);

const sharedProductShape = {
  schemaVersion: z.literal(1),
  id: idSchema,
  lifecycle: z.enum(['active', 'replaced', 'unavailable', 'pending']),
  brand: z.strictObject({ id: idSchema, name: z.string().trim().min(1) }),
  model: z.string().trim().min(1),
  categories: z.array(categorySchema).min(1),
  copy: z.strictObject({ bestFor: localizedTextSchema }),
  technologies: factSchema(z.array(z.string().trim().min(1))),
  images: z.array(imageAssetSchema),
  sources: z.array(sourceSchema),
  comparables: z.array(idSchema),
};

export const shoeProductSchema = z.strictObject({
  ...sharedProductShape,
  kind: z.literal('shoe'),
  specifications: z.strictObject({
    surfaces: factSchema(z.array(z.string().trim().min(1)).min(1)),
    stability: factSchema(z.enum(['neutral', 'stability', 'unknown'])),
    maximumDistance: factSchema(
      z.strictObject({
        amount: z.number().positive().max(1000),
        unit: z.literal('km'),
      }),
    ),
    heelToToeDrop: millimetreFactSchema,
    stackHeight: stackHeightFactSchema,
    weight: weightFactSchema,
    fit: factSchema(z.array(z.string().trim().min(1)).min(1)),
    construction: factSchema(z.array(z.string().trim().min(1)).min(1)),
  }),
});

const futureProductSchema = z.strictObject({
  ...sharedProductShape,
  kind: z.enum(['apparel', 'sock', 'vest', 'accessory']),
  attributes: z.record(
    z.string(),
    factSchema(z.union([z.string(), z.number(), z.boolean()])),
  ),
});

export const productSchema = z.discriminatedUnion('kind', [
  shoeProductSchema,
  futureProductSchema,
]);

export const catalogueSchema = z.array(productSchema);

export type SupportedLocale = (typeof supportedLocales)[number];
export type VerificationStatus = (typeof verificationStatuses)[number];
export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type ProductSource = z.infer<typeof sourceSchema>;
export type Product = z.infer<typeof productSchema>;
export type ShoeProduct = z.infer<typeof shoeProductSchema>;
