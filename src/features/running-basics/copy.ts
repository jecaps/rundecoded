import type { RunningBasicsLocale } from './schema';

export const runningBasicsCopy = {
  de: {
    eyebrow: 'Nachschlagewerk',
    title: 'Laufgrundlagen',
    introduction:
      'Ein praktischer Leitfaden zu Laufmechanik und Schuhmerkmalen, die das Laufgefühl beeinflussen.',
    topics: 'Themen',
    selectTopic: 'Thema auswählen',
  },
  en: {
    eyebrow: 'Reference guide',
    title: 'Running Basics',
    introduction:
      'A practical reference guide to running mechanics and the shoe features that shape how a run feels.',
    topics: 'Topics',
    selectTopic: 'Select topic',
  },
  fr: {
    eyebrow: 'Guide de référence',
    title: 'Les bases de la course',
    introduction:
      'Un guide pratique sur la mécanique de la course et les caractéristiques qui influencent les sensations d’une chaussure.',
    topics: 'Thèmes',
    selectTopic: 'Choisir un thème',
  },
} satisfies Record<
  RunningBasicsLocale,
  {
    eyebrow: string;
    introduction: string;
    selectTopic: string;
    title: string;
    topics: string;
  }
>;
