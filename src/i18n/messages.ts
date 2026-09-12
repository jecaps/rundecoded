import type { Locale } from './config';

export interface SharedMessages {
  banner: {
    catalogueLabel: string;
    description: string;
    eyebrow: string;
  };
  footer: {
    systemPreview: string;
  };
  navigation: {
    catalogue: string;
    runningBasics: string;
  };
  pages: {
    catalogue: { description: string; title: string };
    consultation: { description: string; title: string };
    designSystem: { description: string; title: string };
    runningBasics: { description: string; title: string };
  };
  skipLink: string;
}

export const sharedMessages = {
  en: {
    banner: {
      catalogueLabel: 'RunDecoded catalogue',
      description:
        'Understand what running products are designed to do—from cushioning and stability to surface and intended use.',
      eyebrow: 'Running product training · By Jerika',
    },
    footer: { systemPreview: 'System preview' },
    navigation: {
      catalogue: 'Catalogue',
      runningBasics: 'Running Basics',
    },
    pages: {
      catalogue: {
        description:
          'Explore and compare running shoes by purpose, surface, guidance, and construction.',
        title: 'Running shoe catalogue',
      },
      consultation: {
        description:
          'Guide a customer through a short questionnaire and review explainable running shoe recommendations.',
        title: 'Customer shoe consultation',
      },
      designSystem: {
        description:
          'Preview the RunDecoded design tokens, themes, and accessible interface components.',
        title: 'Design system',
      },
      runningBasics: {
        description:
          'A practical reference to running mechanics and the shoe characteristics that influence how footwear feels.',
        title: 'Running Basics',
      },
    },
    skipLink: 'Skip to content',
  },
  de: {
    banner: {
      catalogueLabel: 'RunDecoded-Katalog',
      description:
        'Verstehe, wofür Laufprodukte entwickelt wurden – von Dämpfung und Stabilität bis zu Untergrund und Einsatzzweck.',
      eyebrow: 'Laufprodukt-Schulung · Von Jerika',
    },
    footer: { systemPreview: 'Systemvorschau' },
    navigation: {
      catalogue: 'Katalog',
      runningBasics: 'Laufgrundlagen',
    },
    pages: {
      catalogue: {
        description:
          'Entdecke und vergleiche Laufschuhe nach Einsatzzweck, Untergrund, Führung und Konstruktion.',
        title: 'Laufschuh-Katalog',
      },
      consultation: {
        description:
          'Führe Kunden durch einen kurzen Fragebogen und prüfe nachvollziehbare Laufschuh-Empfehlungen.',
        title: 'Laufschuh-Kundenberatung',
      },
      designSystem: {
        description:
          'Vorschau der RunDecoded-Design-Tokens, Farbschemata und barrierearmen Komponenten.',
        title: 'Designsystem',
      },
      runningBasics: {
        description:
          'Ein praktischer Leitfaden zu Laufmechanik und Eigenschaften, die das Laufgefühl eines Schuhs beeinflussen.',
        title: 'Laufgrundlagen',
      },
    },
    skipLink: 'Zum Inhalt springen',
  },
  fr: {
    banner: {
      catalogueLabel: 'Catalogue RunDecoded',
      description:
        'Comprenez le rôle des produits de course, de l’amorti et la stabilité jusqu’au terrain et à l’usage prévu.',
      eyebrow: 'Formation aux produits de course · Par Jerika',
    },
    footer: { systemPreview: 'Aperçu du système' },
    navigation: {
      catalogue: 'Catalogue',
      runningBasics: 'Bases de la course',
    },
    pages: {
      catalogue: {
        description:
          'Découvrez et comparez des chaussures de course selon l’usage, le terrain, le guidage et la construction.',
        title: 'Catalogue de chaussures de course',
      },
      consultation: {
        description:
          'Guidez un client dans un court questionnaire et examinez des recommandations de chaussures explicables.',
        title: 'Conseil client chaussures',
      },
      designSystem: {
        description:
          'Aperçu des jetons visuels, des thèmes et des composants accessibles de RunDecoded.',
        title: 'Système de design',
      },
      runningBasics: {
        description:
          'Un guide pratique sur la mécanique de la course et les caractéristiques qui influencent les sensations d’une chaussure.',
        title: 'Les bases de la course',
      },
    },
    skipLink: 'Aller au contenu',
  },
} satisfies Record<Locale, SharedMessages>;
