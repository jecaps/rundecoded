import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';

import { runningBasicsTopicSchema } from '@/features/running-basics/schema';

const runningBasics = defineCollection({
  loader: file('src/content/running-basics/topics.json'),
  schema: runningBasicsTopicSchema,
});

export const collections = { runningBasics };
