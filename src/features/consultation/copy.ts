import type { Locale } from '@/i18n/config';

export interface ConsultationCopy {
  actions: {
    back: string;
    edit: string;
    exit: string;
    next: string;
    restart: string;
    results: string;
    viewCatalogue: string;
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
  eyebrow: string;
  multipleHelp: string;
  notSureNotice: string;
  otherComfortLabel: string;
  otherComfortPlaceholder: string;
  otherGoalLabel: string;
  otherGoalPlaceholder: string;
  otherSurfaceLabel: string;
  otherSurfacePlaceholder: string;
  progress: (current: number, total: number) => string;
  questions: Array<{
    choices: Record<string, { description: string; label: string }>;
    help: string;
    title: string;
  }>;
  resultDisclaimer: string;
  resultGroups: {
    alternative: { empty: string; title: string };
    great: { empty: string; title: string };
    strong: { empty: string; title: string };
  };
  resultIntro: string;
  resultReasons: {
    distance: string;
    goal: string;
    priority: string;
    stability: string;
    surface: string;
  };
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
      viewCatalogue: 'View in catalogue',
    },
    answerRequired: 'Choose an answer to continue.',
    comfortNotice:
      'Comfort history adds context for the employee. It does not diagnose an injury or automatically prescribe a heel-to-toe drop.',
    evidenceConfidence: {
      high: 'High',
      label: 'Evidence confidence',
      low: 'Low',
      medium: 'Medium',
      unknown: 'Incomplete',
    },
    eyebrow: 'Employee customer consultation',
    multipleHelp:
      'Multiple answers are allowed. Select the customer’s most frequent surface first.',
    notSureNotice:
      '“Not sure yet” keeps this criterion neutral. It will not exclude a shoe, but the recommendation will be less specific.',
    otherComfortLabel: 'Add a short comfort note · optional',
    otherComfortPlaceholder: 'For example: discomfort after longer runs',
    otherGoalLabel: 'Describe the other goal · optional',
    otherGoalPlaceholder: 'For example: walking and occasional running',
    otherSurfaceLabel: 'Describe the other surface · optional',
    otherSurfacePlaceholder: 'For example: sandy beach or indoor track',
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
          upTo60: {
            label: '42–60 km',
            description: 'Long trail and ultra sessions',
          },
          over60: {
            label: 'Over 60 km',
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
            label: 'Mixed trails',
            description: 'Changing off-road terrain',
          },
          technicalTrail: {
            label: 'Technical trails',
            description: 'Steep, rocky or rugged routes',
          },
          track: { label: 'Track', description: 'Athletics track or spikes' },
          crossCountry: {
            label: 'Cross-country',
            description: 'Grass, dirt and race courses',
          },
          other: {
            label: 'Other surface',
            description: 'Add a short note if useful',
          },
          unknown: {
            label: 'Not sure yet',
            description: 'Keep surface neutral',
          },
        },
      },
      {
        title: 'What matters most for this customer?',
        help: 'This preference helps rank compatible shoes.',
        choices: {
          comfort: {
            label: 'Comfort',
            description: 'Soft and protective feel',
          },
          versatility: {
            label: 'Versatility',
            description: 'One shoe for varied runs',
          },
          speed: { label: 'Speed', description: 'Lighter and more responsive' },
          guidance: { label: 'Guidance', description: 'A more supported ride' },
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
            label: 'Daily fitness',
            description: 'Regular training and general use',
          },
          longRuns: {
            label: 'Comfortable long runs',
            description: 'More protection over distance',
          },
          fasterTraining: {
            label: 'Faster training',
            description: 'Tempo and interval sessions',
          },
          roadRace: {
            label: 'Road race',
            description: 'Race-day road performance',
          },
          trailRunning: {
            label: 'Trail running',
            description: 'Regular off-road training',
          },
          trailRace: {
            label: 'Trail race',
            description: 'Off-road competition',
          },
          track: {
            label: 'Track or cross-country',
            description: 'Track events and XC races',
          },
          other: {
            label: 'Other goal',
            description: 'Keep the goal neutral and add context later',
          },
          unknown: {
            label: 'Not sure yet',
            description: 'Do not rank by training goal',
          },
        },
      },
      {
        title: 'Does the customer want additional guidance?',
        help: 'Use their preference or prior fitting experience—not a visual diagnosis of gait.',
        choices: {
          neutral: {
            label: 'Neutral',
            description: 'No additional guidance requested',
          },
          stability: {
            label: 'More guidance',
            description: 'Customer prefers a supported ride',
          },
          noPreference: {
            label: 'No preference',
            description: 'Show both neutral and guidance options',
          },
          unknown: {
            label: 'Not sure yet',
            description: 'Keep stability neutral in ranking',
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
          kneesHips: {
            label: 'Knees or hips',
            description: 'Customer reports sensitivity here',
          },
          achillesCalves: {
            label: 'Achilles or calves',
            description: 'Customer reports sensitivity here',
          },
          other: {
            label: 'Other concern',
            description: 'Add a short note if appropriate',
          },
          private: {
            label: 'Prefer not to say',
            description: 'Continue without comfort history',
          },
          unknown: {
            label: 'Not sure yet',
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
    resultGroups: {
      alternative: {
        empty: 'No good alternatives are available for these answers.',
        title: 'Good alternatives',
      },
      great: {
        empty: 'No great matches are available for these answers.',
        title: 'Great matches',
      },
      strong: {
        empty:
          'No shoe meets every essential criterion for a strong match yet.',
        title: 'Strong matches',
      },
    },
    resultIntro:
      'The reasons are shown so the employee can explain each recommendation.',
    resultReasons: {
      distance: 'Supports the selected running distance',
      goal: 'Matches the selected training goal',
      priority: 'Matches the customer’s main priority',
      stability: 'Matches the requested guidance',
      surface: 'Supports the selected running surface',
    },
    resultsTitle: 'Best options for this customer',
    reviewIntro:
      'Answers marked “Not sure yet” remain neutral and do not exclude products.',
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
    title: 'Customer running needs',
  },
  de: {
    actions: {
      back: 'Zurück',
      edit: 'Bearbeiten',
      exit: 'Zurück zum Katalog',
      next: 'Weiter',
      restart: 'Neue Beratung starten',
      results: 'Empfehlungen anzeigen',
      viewCatalogue: 'Im Katalog ansehen',
    },
    answerRequired: 'Wähle eine Antwort, um fortzufahren.',
    comfortNotice:
      'Beschwerden dienen nur als Gesprächskontext. Sie stellen keine Diagnose dar und bestimmen nicht automatisch die Sprengung.',
    evidenceConfidence: {
      high: 'Hoch',
      label: 'Datenvertrauen',
      low: 'Niedrig',
      medium: 'Mittel',
      unknown: 'Unvollständig',
    },
    eyebrow: 'Kundenberatung für Mitarbeitende',
    multipleHelp:
      'Mehrere Antworten sind möglich. Wähle den häufigsten Untergrund zuerst.',
    notSureNotice:
      '„Noch nicht sicher“ lässt dieses Kriterium neutral. Dadurch wird kein Schuh ausgeschlossen, die Empfehlung ist aber weniger spezifisch.',
    otherComfortLabel: 'Kurze Komfortnotiz ergänzen · optional',
    otherComfortPlaceholder: 'Zum Beispiel: Beschwerden nach längeren Läufen',
    otherGoalLabel: 'Anderes Ziel beschreiben · optional',
    otherGoalPlaceholder: 'Zum Beispiel: Walking und gelegentliches Laufen',
    otherSurfaceLabel: 'Anderen Untergrund beschreiben · optional',
    otherSurfacePlaceholder: 'Zum Beispiel: Sandstrand oder Indoor-Bahn',
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
          upTo60: {
            label: '42–60 km',
            description: 'Lange Trail- und Ultraeinheiten',
          },
          over60: {
            label: 'Über 60 km',
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
            label: 'Gemischte Trails',
            description: 'Wechselndes Gelände',
          },
          technicalTrail: {
            label: 'Technische Trails',
            description: 'Steile, felsige oder anspruchsvolle Wege',
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
            label: 'Anderer Untergrund',
            description: 'Bei Bedarf kurze Notiz ergänzen',
          },
          unknown: {
            label: 'Noch nicht sicher',
            description: 'Untergrund neutral lassen',
          },
        },
      },
      {
        title: 'Was ist dem Kunden am wichtigsten?',
        help: 'Diese Präferenz hilft, geeignete Schuhe zu sortieren.',
        choices: {
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
          guidance: {
            label: 'Führung',
            description: 'Stärker unterstütztes Laufgefühl',
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
            label: 'Alltagstraining',
            description: 'Regelmäßiges Training und allgemeine Nutzung',
          },
          longRuns: {
            label: 'Komfortable lange Läufe',
            description: 'Mehr Schutz über längere Distanzen',
          },
          fasterTraining: {
            label: 'Schnelleres Training',
            description: 'Tempo- und Intervalleinheiten',
          },
          roadRace: {
            label: 'Straßenwettkampf',
            description: 'Leistung am Wettkampftag',
          },
          trailRunning: {
            label: 'Trailrunning',
            description: 'Regelmäßiges Offroad-Training',
          },
          trailRace: {
            label: 'Trailwettkampf',
            description: 'Offroad-Wettkampf',
          },
          track: {
            label: 'Bahn oder Crosslauf',
            description: 'Bahndisziplinen und Crossrennen',
          },
          other: {
            label: 'Anderes Ziel',
            description: 'Ziel neutral lassen und später ergänzen',
          },
          unknown: {
            label: 'Noch nicht sicher',
            description: 'Nicht nach Trainingsziel sortieren',
          },
        },
      },
      {
        title: 'Wünscht der Kunde zusätzliche Führung?',
        help: 'Nutze die Präferenz oder bisherige Erfahrung – keine visuelle Ganganalyse.',
        choices: {
          neutral: {
            label: 'Neutral',
            description: 'Keine zusätzliche Führung gewünscht',
          },
          stability: {
            label: 'Mehr Führung',
            description: 'Kunde bevorzugt ein gestütztes Laufgefühl',
          },
          noPreference: {
            label: 'Keine Präferenz',
            description: 'Neutrale und gestützte Optionen zeigen',
          },
          unknown: {
            label: 'Noch nicht sicher',
            description: 'Stabilität neutral lassen',
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
          kneesHips: {
            label: 'Knie oder Hüfte',
            description: 'Kunde berichtet hier Empfindlichkeit',
          },
          achillesCalves: {
            label: 'Achilles oder Waden',
            description: 'Kunde berichtet hier Empfindlichkeit',
          },
          other: {
            label: 'Andere Beschwerden',
            description: 'Bei Bedarf kurze Notiz ergänzen',
          },
          private: {
            label: 'Keine Angabe',
            description: 'Ohne Komforthistorie fortfahren',
          },
          unknown: {
            label: 'Noch nicht sicher',
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
    resultGroups: {
      alternative: {
        empty: 'Für diese Antworten sind keine guten Alternativen verfügbar.',
        title: 'Gute Alternativen',
      },
      great: {
        empty:
          'Für diese Antworten sind keine sehr guten Übereinstimmungen verfügbar.',
        title: 'Sehr gute Übereinstimmungen',
      },
      strong: {
        empty:
          'Noch kein Schuh erfüllt alle wesentlichen Kriterien für eine starke Übereinstimmung.',
        title: 'Starke Übereinstimmungen',
      },
    },
    resultIntro:
      'Die Gründe werden angezeigt, damit Mitarbeitende jede Empfehlung erklären können.',
    resultReasons: {
      distance: 'Geeignet für die gewählte Distanz',
      goal: 'Passt zum gewählten Trainingsziel',
      priority: 'Passt zur wichtigsten Kundenpräferenz',
      stability: 'Passt zur gewünschten Führung',
      surface: 'Geeignet für den gewählten Untergrund',
    },
    resultsTitle: 'Beste Optionen für diesen Kunden',
    reviewIntro:
      '„Noch nicht sicher“ bleibt neutral und schließt keine Produkte aus.',
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
    title: 'Laufbedürfnisse des Kunden',
  },
  fr: {
    actions: {
      back: 'Retour',
      edit: 'Modifier',
      exit: 'Retour au catalogue',
      next: 'Suivant',
      restart: 'Nouvelle consultation',
      results: 'Afficher les recommandations',
      viewCatalogue: 'Voir dans le catalogue',
    },
    answerRequired: 'Choisissez une réponse pour continuer.',
    comfortNotice:
      'L’historique de confort apporte seulement du contexte. Il ne constitue pas un diagnostic et ne prescrit pas automatiquement un drop.',
    evidenceConfidence: {
      high: 'Élevée',
      label: 'Fiabilité des données',
      low: 'Faible',
      medium: 'Moyenne',
      unknown: 'Incomplète',
    },
    eyebrow: 'Conseil client pour les employés',
    multipleHelp:
      'Plusieurs réponses sont possibles. Sélectionnez d’abord la surface la plus fréquente.',
    notSureNotice:
      '« Pas encore sûr » laisse ce critère neutre. Aucune chaussure ne sera exclue, mais la recommandation sera moins précise.',
    otherComfortLabel: 'Ajouter une courte note de confort · facultatif',
    otherComfortPlaceholder: 'Par exemple : gêne après les sorties longues',
    otherGoalLabel: 'Décrire l’autre objectif · facultatif',
    otherGoalPlaceholder: 'Par exemple : marche et course occasionnelle',
    otherSurfaceLabel: 'Décrire l’autre surface · facultatif',
    otherSurfacePlaceholder: 'Par exemple : plage de sable ou piste couverte',
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
          upTo60: {
            label: '42–60 km',
            description: 'Longues sorties trail et ultra',
          },
          over60: {
            label: 'Plus de 60 km',
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
            label: 'Sentiers mixtes',
            description: 'Terrain tout-terrain varié',
          },
          technicalTrail: {
            label: 'Sentiers techniques',
            description: 'Parcours raides, rocheux ou difficiles',
          },
          track: { label: 'Piste', description: 'Athlétisme ou pointes' },
          crossCountry: {
            label: 'Cross-country',
            description: 'Herbe, terre et parcours de course',
          },
          other: {
            label: 'Autre surface',
            description: 'Ajouter une courte note si utile',
          },
          unknown: {
            label: 'Pas encore sûr',
            description: 'Laisser la surface neutre',
          },
        },
      },
      {
        title: 'Qu’est-ce qui compte le plus pour le client ?',
        help: 'Cette préférence aide à classer les chaussures compatibles.',
        choices: {
          comfort: {
            label: 'Confort',
            description: 'Sensation douce et protectrice',
          },
          versatility: {
            label: 'Polyvalence',
            description: 'Une chaussure pour des sorties variées',
          },
          speed: { label: 'Vitesse', description: 'Plus légère et réactive' },
          guidance: {
            label: 'Guidage',
            description: 'Sensation plus soutenue',
          },
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
            label: 'Forme quotidienne',
            description: 'Entraînement régulier et usage général',
          },
          longRuns: {
            label: 'Sorties longues confortables',
            description: 'Plus de protection sur la distance',
          },
          fasterTraining: {
            label: 'Entraînement rapide',
            description: 'Séances de tempo et intervalles',
          },
          roadRace: {
            label: 'Course sur route',
            description: 'Performance le jour de la course',
          },
          trailRunning: {
            label: 'Trail',
            description: 'Entraînement régulier hors route',
          },
          trailRace: {
            label: 'Course de trail',
            description: 'Compétition hors route',
          },
          track: {
            label: 'Piste ou cross-country',
            description: 'Épreuves sur piste et cross',
          },
          other: {
            label: 'Autre objectif',
            description: 'Laisser l’objectif neutre et ajouter du contexte',
          },
          unknown: {
            label: 'Pas encore sûr',
            description: 'Ne pas classer par objectif',
          },
        },
      },
      {
        title: 'Le client souhaite-t-il un guidage supplémentaire ?',
        help: 'Utilisez sa préférence ou son expérience, pas un diagnostic visuel de la foulée.',
        choices: {
          neutral: {
            label: 'Neutre',
            description: 'Aucun guidage supplémentaire demandé',
          },
          stability: {
            label: 'Plus de guidage',
            description: 'Le client préfère une sensation soutenue',
          },
          noPreference: {
            label: 'Aucune préférence',
            description: 'Afficher les options neutres et guidées',
          },
          unknown: {
            label: 'Pas encore sûr',
            description: 'Laisser la stabilité neutre',
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
          kneesHips: {
            label: 'Genoux ou hanches',
            description: 'Le client signale une sensibilité',
          },
          achillesCalves: {
            label: 'Achille ou mollets',
            description: 'Le client signale une sensibilité',
          },
          other: {
            label: 'Autre gêne',
            description: 'Ajouter une courte note si nécessaire',
          },
          private: {
            label: 'Préfère ne pas répondre',
            description: 'Continuer sans historique de confort',
          },
          unknown: {
            label: 'Pas encore sûr',
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
    resultGroups: {
      alternative: {
        empty: 'Aucune bonne alternative n’est disponible pour ces réponses.',
        title: 'Bonnes alternatives',
      },
      great: {
        empty: 'Aucune excellente correspondance n’est disponible.',
        title: 'Excellentes correspondances',
      },
      strong: {
        empty:
          'Aucune chaussure ne remplit encore tous les critères essentiels.',
        title: 'Très bonnes correspondances',
      },
    },
    resultIntro:
      'Les raisons sont affichées afin que l’employé puisse expliquer chaque recommandation.',
    resultReasons: {
      distance: 'Convient à la distance choisie',
      goal: 'Correspond à l’objectif sélectionné',
      priority: 'Correspond à la priorité du client',
      stability: 'Correspond au guidage demandé',
      surface: 'Convient à la surface choisie',
    },
    resultsTitle: 'Meilleures options pour ce client',
    reviewIntro: '« Pas encore sûr » reste neutre et n’exclut aucun produit.',
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
    title: 'Besoins de course du client',
  },
};
