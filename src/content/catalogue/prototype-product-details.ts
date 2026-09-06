import type { LocalizedText } from '@/domain/catalogue';

export interface PrototypeProductDetails {
  overview: LocalizedText;
  cardSummary: LocalizedText;
  bestFor: LocalizedText;
  construction: {
    ride: LocalizedText;
    support: LocalizedText;
    upper: LocalizedText;
    midsole: LocalizedText;
    outsole: LocalizedText;
  };
  decision: {
    bestAt: LocalizedText;
    lessSuitableFor: LocalizedText;
  };
  specifications: {
    fit: LocalizedText;
    plateSystem: LocalizedText;
    stackHeight: string;
    technologies: string[];
    weight: string;
  };
  provenance: {
    label: string;
    note: LocalizedText;
    status: 'fallback';
  };
}

const localized = (de: string, en: string, fr: string): LocalizedText => ({
  de,
  en,
  fr,
});

/**
 * Editorial product knowledge migrated from the original RunDecoded prototype.
 * Entries are keyed by the new catalogue's exact product ID; similar model names
 * are deliberately not matched. This is migration evidence, not a claim that
 * the information has been freshly manufacturer-verified.
 */
export const prototypeProductDetails: Partial<
  Record<string, PrototypeProductDetails>
> = {
  'adidas-adizero-boston-13': {
    cardSummary: localized(
      'Dynamischer Super-Trainer mit Lightstrike Pro und ENERGYRODS 2.0 für schnelle Trainingsläufe und Marathonvorbereitung.',
      'Dynamic super trainer with Lightstrike Pro and ENERGYRODS 2.0 for fast sessions and marathon preparation.',
      'Super-trainer dynamique avec Lightstrike Pro et ENERGYRODS 2.0 pour les séances rapides et la préparation marathon.',
    ),
    overview: localized(
      'Der Boston 13 bringt Wettkampf-Technologien in einen robusteren Trainingsschuh. LIGHTSTRIKE PRO liefert Energierückgabe, LIGHTSTRIKE sorgt für eine kontrolliertere Basis und ENERGYRODS 2.0 unterstützen schnelle, explosive Übergänge.',
      'The Boston 13 brings race-inspired technology into a more durable training shoe. LIGHTSTRIKE PRO supplies energy return, LIGHTSTRIKE adds a more controlled base, and ENERGYRODS 2.0 support fast, explosive transitions.',
      'La Boston 13 transpose des technologies de compétition dans une chaussure d’entraînement plus durable. LIGHTSTRIKE PRO apporte du retour d’énergie, LIGHTSTRIKE stabilise la base et ENERGYRODS 2.0 favorise des transitions rapides et explosives.',
    ),
    bestFor: localized(
      'Tempo · Intervalle · lange schnelle Läufe · Marathonvorbereitung',
      'Tempo · intervals · long fast runs · marathon training',
      'Tempo · intervalles · longues sorties rapides · préparation marathon',
    ),
    construction: {
      ride: localized(
        'Straff-dynamisch mit deutlichem Vortrieb; schneller als ein klassischer Daily Trainer, aber vielseitiger als ein reiner Race-Schuh.',
        'Firm and dynamic with clear propulsion; faster than a classic daily trainer but more versatile than a pure race shoe.',
        'Ferme et dynamique avec une propulsion marquée ; plus rapide qu’une chaussure quotidienne classique mais plus polyvalente qu’une pure chaussure de compétition.',
      ),
      support: localized(
        'Neutraler Performance-Trainer; ENERGYRODS 2.0 unterstützen die Übergänge, sind aber kein Stabilitätssystem.',
        'Neutral performance trainer; ENERGYRODS 2.0 assist transitions but are not a stability system.',
        'Chaussure performance neutre ; ENERGYRODS 2.0 accompagnent les transitions sans constituer un système de stabilité.',
      ),
      upper: localized(
        'Leichter technischer Mesh-Schaft mit gezieltem Halt und normaler Passform.',
        'Light technical mesh upper with targeted hold and a regular fit.',
        'Tige légère en mesh technique avec maintien ciblé et chaussant standard.',
      ),
      midsole: localized(
        'Kombination aus LIGHTSTRIKE PRO für Energierückgabe und LIGHTSTRIKE für dynamische, kontrollierte Dämpfung.',
        'Combination of LIGHTSTRIKE PRO for energy return and LIGHTSTRIKE for dynamic, controlled cushioning.',
        'Association de LIGHTSTRIKE PRO pour le retour d’énergie et LIGHTSTRIKE pour un amorti dynamique et contrôlé.',
      ),
      outsole: localized(
        'Continental™ Gummi für zuverlässigen Grip; im Prototyp wurde außerdem eine Lighttraxion-Konstruktion dokumentiert.',
        'Continental™ rubber for reliable grip; the prototype also documented Lighttraxion construction.',
        'Caoutchouc Continental™ pour une adhérence fiable ; le prototype documentait également la construction Lighttraxion.',
      ),
    },
    decision: {
      bestAt: localized(
        'schnelles Training mit reaktivem Vortrieb',
        'fast training with a responsive, propulsive ride',
        'entraînement rapide et propulsion réactive',
      ),
      lessSuitableFor: localized(
        'sehr langsame Läufe oder technisches Gelände',
        'very slow running or technical terrain',
        'footings très lents ou terrain technique',
      ),
    },
    specifications: {
      fit: localized('Normal', 'Regular', 'Standard'),
      plateSystem: localized(
        'ENERGYRODS 2.0',
        'ENERGYRODS 2.0',
        'ENERGYRODS 2.0',
      ),
      stackHeight: '36 / 30 mm',
      technologies: [
        'LIGHTSTRIKE PRO',
        'LIGHTSTRIKE',
        'ENERGYRODS 2.0',
        'Continental™ Rubber',
      ],
      weight: '260 g',
    },
    provenance: {
      label: 'Original RunDecoded prototype',
      note: localized(
        'Aus dem ursprünglichen RunDecoded-Prototyp übernommen. Eine erneute Herstellerprüfung steht noch aus.',
        'Migrated from the original RunDecoded prototype. Manufacturer re-verification is pending.',
        'Données reprises du prototype RunDecoded d’origine. Une nouvelle vérification auprès du fabricant est en attente.',
      ),
      status: 'fallback',
    },
  },
};
