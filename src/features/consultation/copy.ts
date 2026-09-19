import type { Locale } from '@/i18n/config';

export interface ConsultationCopy {
  actions: {
    back: string;
    edit: string;
    exit: string;
    next: string;
    restart: string;
    results: string;
    showMore: string;
    viewDetails: string;
  };
  answerRequired: string;
  comfortNotice: string;
  evidenceConfidence: {
    high: string;
    label: string;
    low: string;
    medium: string;
    unknown: string;
  };
  explanation: {
    why: string;
  };
  eyebrow: string;
  multipleHelp: string;
  priorityMultipleHelp: string;
  notSureNotice: string;
  otherGoalLabel: string;
  otherGoalPlaceholder: string;
  otherSurfaceLabel: string;
  otherSurfacePlaceholder: string;
  trackSurfaceFollowUp: string;
  trailSurfaceFollowUp: string;
  progress: (current: number, total: number) => string;
  questions: Array<{
    choices: Record<string, { description: string; label: string }>;
    help: string;
    title: string;
  }>;
  resultDisclaimer: string;
  resultsTitle: string;
  reviewIntro: string;
  reviewMissing: string;
  steps: string[];
  tiers: { alternative: string; great: string; strong: string };
  title: string;
}

export const consultationCopy: Record<Locale, ConsultationCopy> = {
  en: {
    actions: {
      back: 'Back',
      edit: 'Edit',
      exit: 'Back to catalogue',
      next: 'Next',
      restart: 'Start another consultation',
      results: 'Show recommendations',
      showMore: 'Show more recommendations',
      viewDetails: 'View details',
    },
    answerRequired: 'Choose an answer to continue.',
    comfortNotice:
      'Comfort history adds a small ranking preference for the employee. It does not diagnose an injury or promise relief.',
    evidenceConfidence: {
      high: 'High',
      label: 'Evidence confidence',
      low: 'Low',
      medium: 'Medium',
      unknown: 'Incomplete',
    },
    explanation: {
      why: 'Why this shoe',
    },
    eyebrow: 'Guided shoe selection',
    multipleHelp:
      'Multiple answers are allowed. Select the customer’s most frequent surface first.',
    priorityMultipleHelp:
      'Choose one or two priorities. When two are selected, they share the same total influence.',
    notSureNotice:
      '“Not sure yet” keeps this criterion neutral. It will not exclude a shoe, but the recommendation will be less specific.',
    otherGoalLabel: 'Describe the other goal · optional',
    otherGoalPlaceholder: 'For example: walking and occasional running',
    otherSurfaceLabel: 'Describe the other surface · optional',
    otherSurfacePlaceholder: 'For example: sandy beach or indoor track',
    trackSurfaceFollowUp: 'Which surface matters most?',
    trailSurfaceFollowUp: 'What kind of trail terrain matters most?',
    progress: (current, total) => `Step ${current} of ${total}`,
    questions: [
      {
        title: 'How far does the customer usually run in one session?',
        help: 'Choose the closest typical distance—not the longest-ever run.',
        choices: {
          under5: {
            label: 'Under 5 km',
            description: 'Short runs and first sessions',
          },
          upTo10: {
            label: '5–10 km',
            description: 'Regular everyday distance',
          },
          upTo21: {
            label: '10–21 km',
            description: 'Longer training sessions',
          },
          upTo42: {
            label: '21–42 km',
            description: 'Marathon-distance training',
          },
          over42: {
            label: 'Over 42 km',
            description: 'Ultra-distance running',
          },
          unknown: {
            label: 'Not sure yet',
            description: 'Do not use distance as a strict filter',
          },
        },
      },
      {
        title: 'Where does the customer run most often?',
        help: 'Choose every surface that regularly matters.',
        choices: {
          road: { label: 'Road', description: 'Pavement and cycle paths' },
          gravel: {
            label: 'Parks & gravel',
            description: 'Firm paths and light trails',
          },
          trail: {
            label: 'Trail / off-road',
            description: 'Unpaved routes and natural terrain',
          },
          trackCrossCountry: {
            label: 'Track or cross-country',
            description: 'Athletics tracks, grass and race courses',
          },
          easyTerrain: {
            label: 'Easy terrain',
            description: 'Smooth, firm and runnable paths',
          },
          mixedTerrain: {
            label: 'Mixed terrain',
            description: 'A mix of runnable and technical sections',
          },
          technicalTerrain: {
            label: 'Technical terrain',
            description: 'Steep, rocky, muddy or rugged routes',
          },
          track: { label: 'Track', description: 'Athletics track or spikes' },
          crossCountry: {
            label: 'Cross-country',
            description: 'Grass, dirt and race courses',
          },
          other: {
            label: 'Other / not sure',
            description: 'Keep surface neutral or add a short note',
          },
        },
      },
      {
        title: 'What matters most for this customer?',
        help: 'This preference helps rank compatible shoes.',
        choices: {
          value: {
            label: 'Value',
            description: 'An accessible choice at a sensible price',
          },
          comfort: {
            label: 'Comfort',
            description: 'Soft and protective feel',
          },
          versatility: {
            label: 'Versatility',
            description: 'One shoe for varied runs',
          },
          speed: { label: 'Speed', description: 'Lighter and more responsive' },
          unknown: {
            label: 'Not sure yet',
            description: 'Keep this preference neutral',
          },
        },
      },
      {
        title: 'What is the customer’s main running goal?',
        help: 'Choose the closest goal for the shoe being discussed.',
        choices: {
          startRunning: {
            label: 'Start running',
            description: 'First runs and building consistency',
          },
          dailyFitness: {
            label: 'Daily or easy running',
            description: 'Regular training and comfortable everyday runs',
          },
          longRuns: {
            label: 'Comfortable long runs',
            description: 'More protection over distance',
          },
          fasterTraining: {
            label: 'Faster training',
            description: 'Tempo and interval sessions',
          },
          race: {
            label: 'Racing',
            description: 'Performance for the customer’s chosen surface',
          },
          other: {
            label: 'Other / not sure',
            description: 'Keep the goal neutral or add context',
          },
        },
      },
      {
        title: 'Does the customer want additional guidance?',
        help: 'Use their preference or prior fitting experience—not a visual diagnosis of gait.',
        choices: {
          neutral: {
            label: 'No additional guidance',
            description: 'No additional guidance requested',
          },
          stability: {
            label: 'Prefers additional guidance',
            description: 'Customer prefers a supported ride',
          },
          noPreference: {
            label: 'No preference / not sure',
            description: 'Show both neutral and guidance options',
          },
        },
      },
      {
        title: 'Is there any relevant comfort history?',
        help: 'Multiple answers are allowed. This is conversation context, not a medical assessment.',
        choices: {
          none: {
            label: 'No current concern',
            description: 'Nothing relevant reported',
          },
          knees: {
            label: 'Knees',
            description: 'Light preference for protective cushioning',
          },
          hips: {
            label: 'Hips',
            description: 'Light preference for a lower-drop option',
          },
          achillesCalves: {
            label: 'Achilles or calves',
            description: 'Light preference for a higher-drop option',
          },
          private: {
            label: 'Prefer not to say / not sure',
            description: 'Continue without this context',
          },
        },
      },
      {
        title: 'Review the customer’s answers',
        help: 'Confirm the information before generating recommendations.',
        choices: {},
      },
    ],
    resultDisclaimer:
      'Recommendations describe product suitability from available product data. They do not diagnose injuries or replace professional medical advice.',
    resultsTitle: 'Best options for this customer',
    reviewIntro:
      'Answers marked “not sure” or “no preference” remain neutral and do not exclude products.',
    reviewMissing: 'Not sure yet',
    steps: [
      'Distance',
      'Running surfaces',
      'Main priority',
      'Training goal',
      'Support needs',
      'Comfort history',
      'Review',
    ],
    tiers: {
      alternative: 'Good alternative',
      great: 'Great match',
      strong: 'Strong match',
    },
    title: 'Customer consultation',
  },
  de: {
    actions: {
      back: 'Zurück',
      edit: 'Bearbeiten',
      exit: 'Zurück zum Katalog',
      next: 'Weiter',
      restart: 'Neue Beratung starten',
      results: 'Empfehlungen anzeigen',
      showMore: 'Weitere Empfehlungen anzeigen',
      viewDetails: 'Details ansehen',
    },
    answerRequired: 'Wähle eine Antwort, um fortzufahren.',
    comfortNotice:
      'Komforterfahrungen beeinflussen die Rangfolge nur leicht. Sie stellen keine Diagnose dar und versprechen keine Linderung.',
    evidenceConfidence: {
      high: 'Hoch',
      label: 'Datenvertrauen',
      low: 'Niedrig',
      medium: 'Mittel',
      unknown: 'Unvollständig',
    },
    explanation: {
      why: 'Warum dieser Schuh',
    },
    eyebrow: 'Geführte Schuhauswahl',
    multipleHelp:
      'Mehrere Antworten sind möglich. Wähle den häufigsten Untergrund zuerst.',
    priorityMultipleHelp:
      'Wähle eine oder zwei Prioritäten. Bei zwei Antworten teilen sie sich denselben Gesamteinfluss.',
    notSureNotice:
      '„Noch nicht sicher“ lässt dieses Kriterium neutral. Dadurch wird kein Schuh ausgeschlossen, die Empfehlung ist aber weniger spezifisch.',
    otherGoalLabel: 'Anderes Ziel beschreiben · optional',
    otherGoalPlaceholder: 'Zum Beispiel: Walking und gelegentliches Laufen',
    otherSurfaceLabel: 'Anderen Untergrund beschreiben · optional',
    otherSurfacePlaceholder: 'Zum Beispiel: Sandstrand oder Indoor-Bahn',
    trackSurfaceFollowUp: 'Welcher Untergrund ist am wichtigsten?',
    trailSurfaceFollowUp: 'Welche Art von Gelände ist am wichtigsten?',
    progress: (current, total) => `Schritt ${current} von ${total}`,
    questions: [
      {
        title: 'Wie weit läuft der Kunde normalerweise pro Einheit?',
        help: 'Wähle die typische Distanz – nicht den längsten Lauf überhaupt.',
        choices: {
          under5: {
            label: 'Unter 5 km',
            description: 'Kurze Läufe und erste Einheiten',
          },
          upTo10: {
            label: '5–10 km',
            description: 'Regelmäßige Alltagsdistanz',
          },
          upTo21: {
            label: '10–21 km',
            description: 'Längere Trainingseinheiten',
          },
          upTo42: {
            label: '21–42 km',
            description: 'Training bis zur Marathondistanz',
          },
          over42: {
            label: 'Über 42 km',
            description: 'Ultradistanzläufe',
          },
          unknown: {
            label: 'Noch nicht sicher',
            description: 'Distanz nicht als festen Filter verwenden',
          },
        },
      },
      {
        title: 'Wo läuft der Kunde am häufigsten?',
        help: 'Wähle alle regelmäßig relevanten Untergründe.',
        choices: {
          road: { label: 'Straße', description: 'Asphalt und Radwege' },
          gravel: {
            label: 'Parks & Schotter',
            description: 'Feste Wege und leichte Trails',
          },
          trail: {
            label: 'Trail / Gelände',
            description: 'Unbefestigte Wege und natürliches Gelände',
          },
          trackCrossCountry: {
            label: 'Bahn oder Crosslauf',
            description: 'Leichtathletikbahn, Gras und Wettkampfstrecken',
          },
          easyTerrain: {
            label: 'Einfaches Gelände',
            description: 'Glatte, feste und gut laufbare Wege',
          },
          mixedTerrain: {
            label: 'Gemischtes Gelände',
            description: 'Laufbare und technische Abschnitte',
          },
          technicalTerrain: {
            label: 'Technisches Gelände',
            description: 'Steile, felsige, schlammige oder anspruchsvolle Wege',
          },
          track: {
            label: 'Bahn',
            description: 'Leichtathletikbahn oder Spikes',
          },
          crossCountry: {
            label: 'Crosslauf',
            description: 'Gras, Erde und Wettkampfstrecken',
          },
          other: {
            label: 'Anderer / nicht sicher',
            description: 'Neutral lassen oder kurze Notiz ergänzen',
          },
        },
      },
      {
        title: 'Was ist dem Kunden am wichtigsten?',
        help: 'Diese Präferenz hilft, geeignete Schuhe zu sortieren.',
        choices: {
          value: {
            label: 'Preis-Leistung',
            description: 'Eine zugängliche Wahl zu einem vernünftigen Preis',
          },
          comfort: {
            label: 'Komfort',
            description: 'Weiches und schützendes Laufgefühl',
          },
          versatility: {
            label: 'Vielseitigkeit',
            description: 'Ein Schuh für verschiedene Läufe',
          },
          speed: {
            label: 'Tempo',
            description: 'Leichter und reaktionsfreudiger',
          },
          unknown: {
            label: 'Noch nicht sicher',
            description: 'Präferenz neutral lassen',
          },
        },
      },
      {
        title: 'Was ist das wichtigste Laufziel?',
        help: 'Wähle das passendste Ziel für den besprochenen Schuh.',
        choices: {
          startRunning: {
            label: 'Mit dem Laufen beginnen',
            description: 'Erste Läufe und Routine aufbauen',
          },
          dailyFitness: {
            label: 'Alltägliche oder lockere Läufe',
            description: 'Regelmäßiges Training und komfortable Alltagsläufe',
          },
          longRuns: {
            label: 'Komfortable lange Läufe',
            description: 'Mehr Schutz über längere Distanzen',
          },
          fasterTraining: {
            label: 'Schnelleres Training',
            description: 'Tempo- und Intervalleinheiten',
          },
          race: {
            label: 'Wettkampf',
            description: 'Leistung auf dem gewählten Untergrund',
          },
          other: {
            label: 'Anderes / nicht sicher',
            description: 'Ziel neutral lassen oder Kontext ergänzen',
          },
        },
      },
      {
        title: 'Wünscht der Kunde zusätzliche Führung?',
        help: 'Nutze die Präferenz oder bisherige Erfahrung – keine visuelle Ganganalyse.',
        choices: {
          neutral: {
            label: 'Keine zusätzliche Führung',
            description: 'Keine zusätzliche Führung gewünscht',
          },
          stability: {
            label: 'Zusätzliche Führung gewünscht',
            description: 'Kunde bevorzugt ein gestütztes Laufgefühl',
          },
          noPreference: {
            label: 'Keine Präferenz / nicht sicher',
            description: 'Neutrale und gestützte Optionen zeigen',
          },
        },
      },
      {
        title: 'Gibt es relevante Komforterfahrungen?',
        help: 'Mehrere Antworten sind möglich. Dies ist keine medizinische Beurteilung.',
        choices: {
          none: {
            label: 'Aktuell keine Beschwerden',
            description: 'Nichts Relevantes angegeben',
          },
          knees: {
            label: 'Knie',
            description: 'Leichte Präferenz für schützende Dämpfung',
          },
          hips: {
            label: 'Hüfte',
            description: 'Leichte Präferenz für eine niedrigere Sprengung',
          },
          achillesCalves: {
            label: 'Achilles oder Waden',
            description: 'Leichte Präferenz für eine höhere Sprengung',
          },
          private: {
            label: 'Keine Angabe / nicht sicher',
            description: 'Ohne diesen Kontext fortfahren',
          },
        },
      },
      {
        title: 'Antworten des Kunden prüfen',
        help: 'Bestätige die Angaben vor der Empfehlung.',
        choices: {},
      },
    ],
    resultDisclaimer:
      'Empfehlungen beschreiben die Produkteignung anhand verfügbarer Produktdaten. Sie stellen keine Diagnose dar und ersetzen keine medizinische Beratung.',
    resultsTitle: 'Beste Optionen für diesen Kunden',
    reviewIntro:
      '„Nicht sicher“ und „keine Präferenz“ bleiben neutral und schließen keine Produkte aus.',
    reviewMissing: 'Noch nicht sicher',
    steps: [
      'Distanz',
      'Untergründe',
      'Hauptpriorität',
      'Trainingsziel',
      'Unterstützung',
      'Komforthistorie',
      'Prüfen',
    ],
    tiers: {
      alternative: 'Gute Alternative',
      great: 'Sehr gute Übereinstimmung',
      strong: 'Starke Übereinstimmung',
    },
    title: 'Kundenberatung',
  },
  fr: {
    actions: {
      back: 'Retour',
      edit: 'Modifier',
      exit: 'Retour au catalogue',
      next: 'Suivant',
      restart: 'Nouvelle consultation',
      results: 'Afficher les recommandations',
      showMore: 'Afficher plus de recommandations',
      viewDetails: 'Voir les détails',
    },
    answerRequired: 'Choisissez une réponse pour continuer.',
    comfortNotice:
      'L’historique de confort influence légèrement le classement. Il ne constitue pas un diagnostic et ne promet aucun soulagement.',
    evidenceConfidence: {
      high: 'Élevée',
      label: 'Fiabilité des données',
      low: 'Faible',
      medium: 'Moyenne',
      unknown: 'Incomplète',
    },
    explanation: {
      why: 'Pourquoi cette chaussure',
    },
    eyebrow: 'Sélection guidée de chaussures',
    multipleHelp:
      'Plusieurs réponses sont possibles. Sélectionnez d’abord la surface la plus fréquente.',
    priorityMultipleHelp:
      'Choisissez une ou deux priorités. Avec deux réponses, elles partagent la même influence totale.',
    notSureNotice:
      '« Pas encore sûr » laisse ce critère neutre. Aucune chaussure ne sera exclue, mais la recommandation sera moins précise.',
    otherGoalLabel: 'Décrire l’autre objectif · facultatif',
    otherGoalPlaceholder: 'Par exemple : marche et course occasionnelle',
    otherSurfaceLabel: 'Décrire l’autre surface · facultatif',
    otherSurfacePlaceholder: 'Par exemple : plage de sable ou piste couverte',
    trackSurfaceFollowUp: 'Quelle surface compte le plus ?',
    trailSurfaceFollowUp: 'Quel type de terrain trail compte le plus ?',
    progress: (current, total) => `Étape ${current} sur ${total}`,
    questions: [
      {
        title:
          'Quelle distance le client parcourt-il habituellement par sortie ?',
        help: 'Choisissez la distance typique, pas sa sortie la plus longue.',
        choices: {
          under5: {
            label: 'Moins de 5 km',
            description: 'Sorties courtes et premières séances',
          },
          upTo10: {
            label: '5–10 km',
            description: 'Distance quotidienne habituelle',
          },
          upTo21: { label: '10–21 km', description: 'Séances plus longues' },
          upTo42: {
            label: '21–42 km',
            description: 'Entraînement jusqu’au marathon',
          },
          over42: {
            label: 'Plus de 42 km',
            description: 'Course d’ultra-distance',
          },
          unknown: {
            label: 'Pas encore sûr',
            description: 'Ne pas utiliser la distance comme filtre strict',
          },
        },
      },
      {
        title: 'Où le client court-il le plus souvent ?',
        help: 'Choisissez toutes les surfaces régulièrement utilisées.',
        choices: {
          road: { label: 'Route', description: 'Bitume et pistes cyclables' },
          gravel: {
            label: 'Parcs et gravier',
            description: 'Chemins fermes et sentiers faciles',
          },
          trail: {
            label: 'Trail / hors route',
            description: 'Parcours non goudronnés et terrains naturels',
          },
          trackCrossCountry: {
            label: 'Piste ou cross-country',
            description: 'Piste d’athlétisme, herbe et parcours de course',
          },
          easyTerrain: {
            label: 'Terrain facile',
            description: 'Chemins lisses, fermes et roulants',
          },
          mixedTerrain: {
            label: 'Terrain mixte',
            description: 'Sections roulantes et techniques',
          },
          technicalTerrain: {
            label: 'Terrain technique',
            description: 'Parcours raides, rocheux, boueux ou difficiles',
          },
          track: { label: 'Piste', description: 'Athlétisme ou pointes' },
          crossCountry: {
            label: 'Cross-country',
            description: 'Herbe, terre et parcours de course',
          },
          other: {
            label: 'Autre / pas encore sûr',
            description: 'Rester neutre ou ajouter une courte note',
          },
        },
      },
      {
        title: 'Qu’est-ce qui compte le plus pour le client ?',
        help: 'Cette préférence aide à classer les chaussures compatibles.',
        choices: {
          value: {
            label: 'Bon rapport qualité-prix',
            description: 'Un choix accessible à un prix raisonnable',
          },
          comfort: {
            label: 'Confort',
            description: 'Sensation douce et protectrice',
          },
          versatility: {
            label: 'Polyvalence',
            description: 'Une chaussure pour des sorties variées',
          },
          speed: { label: 'Vitesse', description: 'Plus légère et réactive' },
          unknown: {
            label: 'Pas encore sûr',
            description: 'Laisser cette préférence neutre',
          },
        },
      },
      {
        title: 'Quel est l’objectif principal du client ?',
        help: 'Choisissez l’objectif le plus proche pour la chaussure discutée.',
        choices: {
          startRunning: {
            label: 'Commencer à courir',
            description: 'Premières sorties et régularité',
          },
          dailyFitness: {
            label: 'Course quotidienne ou facile',
            description: 'Entraînement régulier et sorties confortables',
          },
          longRuns: {
            label: 'Sorties longues confortables',
            description: 'Plus de protection sur la distance',
          },
          fasterTraining: {
            label: 'Entraînement rapide',
            description: 'Séances de tempo et intervalles',
          },
          race: {
            label: 'Compétition',
            description: 'Performance sur la surface choisie',
          },
          other: {
            label: 'Autre / pas encore sûr',
            description: 'Rester neutre ou ajouter du contexte',
          },
        },
      },
      {
        title: 'Le client souhaite-t-il un guidage supplémentaire ?',
        help: 'Utilisez sa préférence ou son expérience, pas un diagnostic visuel de la foulée.',
        choices: {
          neutral: {
            label: 'Aucun guidage supplémentaire',
            description: 'Aucun guidage supplémentaire demandé',
          },
          stability: {
            label: 'Préfère un guidage supplémentaire',
            description: 'Le client préfère une sensation soutenue',
          },
          noPreference: {
            label: 'Aucune préférence / pas encore sûr',
            description: 'Afficher les options neutres et guidées',
          },
        },
      },
      {
        title: 'Y a-t-il un historique de confort pertinent ?',
        help: 'Plusieurs réponses sont possibles. Ce n’est pas une évaluation médicale.',
        choices: {
          none: {
            label: 'Aucune gêne actuelle',
            description: 'Rien de pertinent signalé',
          },
          knees: {
            label: 'Genoux',
            description: 'Légère préférence pour un amorti protecteur',
          },
          hips: {
            label: 'Hanches',
            description: 'Légère préférence pour un drop plus faible',
          },
          achillesCalves: {
            label: 'Achille ou mollets',
            description: 'Légère préférence pour un drop plus élevé',
          },
          private: {
            label: 'Préfère ne pas répondre / pas encore sûr',
            description: 'Continuer sans ce contexte',
          },
        },
      },
      {
        title: 'Vérifier les réponses du client',
        help: 'Confirmez les informations avant de générer les recommandations.',
        choices: {},
      },
    ],
    resultDisclaimer:
      'Les recommandations décrivent l’adéquation des produits à partir des données disponibles. Elles ne diagnostiquent pas les blessures et ne remplacent pas un avis médical.',
    resultsTitle: 'Meilleures options pour ce client',
    reviewIntro:
      '« Pas encore sûr » et « aucune préférence » restent neutres et n’excluent aucun produit.',
    reviewMissing: 'Pas encore sûr',
    steps: [
      'Distance',
      'Surfaces',
      'Priorité',
      'Objectif',
      'Maintien',
      'Historique de confort',
      'Vérifier',
    ],
    tiers: {
      alternative: 'Bonne alternative',
      great: 'Excellente correspondance',
      strong: 'Très bonne correspondance',
    },
    title: 'Conseil client',
  },
};
