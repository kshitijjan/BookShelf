import { ScholarlyRankOption, PersonalityOption, GenreOption } from '../types/user';

export const SCHOLARLY_RANKS: ScholarlyRankOption[] = [
  {
    id: 'bibliophile-scholar',
    title: 'Bibliophile Scholar',
    description: 'Devoted to classical literature, deep literary commentary, and historical folios.'
  },
  {
    id: 'literary-voyager',
    title: 'Literary Voyager',
    description: 'Travels through diverse eras and speculative realms with restless curiosity.'
  },
  {
    id: 'keeper-of-lost-folios',
    title: 'Keeper of Lost Folios',
    description: 'Preserver of forgotten texts, out-of-print prints, and tactile paper artifacts.'
  },
  {
    id: 'midnight-prose-hunter',
    title: 'Midnight Prose Hunter',
    description: 'A nocturnal reader who savors haunting prose under the glow of quiet lamps.'
  },
  {
    id: 'philosophical-flaneur',
    title: 'Philosophical Flâneur',
    description: 'Roams through existential ideas, ethics, and contemplative human dilemmas.'
  },
  {
    id: 'modern-polymath',
    title: 'Modern Polymath',
    description: 'Cross-pollinates scientific thought, worldly strategy, and creative architecture.'
  }
];

export const READING_PERSONALITIES: PersonalityOption[] = [
  {
    id: 'archivist',
    title: 'Archivist',
    iconName: 'Archive',
    description: 'Preserves margins, bookmarks editions, and respects the physical craft of ink and paper.',
    quote: 'Every volume holds memory.'
  },
  {
    id: 'reader',
    title: 'Reader',
    iconName: 'BookOpen',
    description: 'Voracious and immersed. Lives a thousand lives and reads everywhere without boundaries.',
    quote: 'Lost in the stream of words.'
  },
  {
    id: 'philosopher',
    title: 'Philosopher',
    iconName: 'Compass',
    description: 'Underlines existential dilemmas, seeks timeless wisdom, and questions reality.',
    quote: 'Reading to understand existence.'
  },
  {
    id: 'critic',
    title: 'Critic',
    iconName: 'Feather',
    description: 'Dissects authorial cadence, sentence architecture, and literary subtext.',
    quote: 'Attuned to prose craft.'
  },
  {
    id: 'escapist',
    title: 'Escapist',
    iconName: 'Sparkles',
    description: 'Seeks immersive sanctuary in far-off worlds, speculative visions, and emotional solace.',
    quote: 'A haven from the noisy world.'
  },
  {
    id: 'curator',
    title: 'Curator',
    iconName: 'Library',
    description: 'Bespoke shelf architect who loves pairing the right book with the right human soul.',
    quote: 'Books find their rightful readers.'
  }
];

export const CURATED_GENRES: GenreOption[] = [
  {
    id: 'business',
    title: 'Business & Leadership',
    adjective: 'Strategic',
    noun: 'Executive',
    description: 'Strategy, organizational mastery, scale, and decisive leadership'
  },
  {
    id: 'finance',
    title: 'Money, Finance & Stock Market',
    adjective: 'Calculated',
    noun: 'Capitalist',
    description: 'Investing principles, wealth dynamics, equities, and market psychology'
  },
  {
    id: 'startups',
    title: 'Startups & Entrepreneurship',
    adjective: 'Vanguard',
    noun: 'Builder',
    description: 'Zero to one creation, disruptive products, venture, and hustle'
  },
  {
    id: 'tech',
    title: 'Technology & Artificial Intelligence',
    adjective: 'Cybernetic',
    noun: 'Futurist',
    description: 'Cutting-edge AI, software revolutions, systems, and digital frontiers'
  },
  {
    id: 'philosophy',
    title: 'Philosophy & Stoicism',
    adjective: 'Contemplative',
    noun: 'Dialectic',
    description: 'Ancient wisdom, Seneca, Marcus Aurelius, ethics, and mental models'
  },
  {
    id: 'fantasy',
    title: 'Fantasy & Epic Sagas',
    adjective: 'Mythic',
    noun: 'Arcanist',
    description: 'Magical realms, Harry Potter, Middle-earth, and spellbinding sagas'
  },
  {
    id: 'scifi',
    title: 'Sci-Fi & Cosmic Horizons',
    adjective: 'Speculative',
    noun: 'Cosmist',
    description: 'Space operas, alternate dimensions, cyberpunk, and cosmic dilemmas'
  },
  {
    id: 'psychology',
    title: 'Psychology & Human Behavior',
    adjective: 'Introspective',
    noun: 'Humanist',
    description: 'Cognitive biases, emotional intelligence, habits, and human nature'
  },
  {
    id: 'mystery',
    title: 'Mystery & Psychological Thrillers',
    adjective: 'Nocturne',
    noun: 'Enigma',
    description: 'Gripping whodunits, forensic suspense, plot twists, and dark noir'
  },
  {
    id: 'selfhelp',
    title: 'Self-Mastery & Productivity',
    adjective: 'Disciplined',
    noun: 'Practitioner',
    description: 'Peak performance, deep work, atomic habits, and lifestyle craft'
  },
  {
    id: 'biographies',
    title: 'Biographies & Memoirs',
    adjective: 'Chronicle',
    noun: 'Biographer',
    description: 'Lived lessons of titans, inventors, leaders, and intimate personal truths'
  },
  {
    id: 'classics',
    title: 'Classic Literature & Fiction',
    adjective: 'Classical',
    noun: 'Canonist',
    description: 'Enduring masterpieces, literary fiction, character epics, and prose craft'
  }
];

/**
 * Generates an evocative, poetic Taste Profile term based on at least 2 chosen genres.
 * Matches combinations like "Contemplative Speculative", "Vanguard Strategist", etc.
 */
export const generateTasteProfile = (genreIds: string[]): string => {
  if (genreIds.length === 0) return '';
  if (genreIds.length === 1) {
    const single = CURATED_GENRES.find((g) => g.id === genreIds[0]);
    return single ? `${single.adjective} Mind` : 'Curious Reader';
  }

  const set = new Set(genreIds);

  // Handcrafted premium pairings
  if (set.has('philosophy') && set.has('scifi')) {
    return 'Contemplative Speculative';
  }
  if (set.has('business') && set.has('startups')) {
    return 'Vanguard Strategist';
  }
  if (set.has('business') && set.has('finance')) {
    return 'Strategic Capitalist';
  }
  if (set.has('finance') && set.has('philosophy')) {
    return 'Pragmatic Stoic';
  }
  if (set.has('finance') && set.has('tech')) {
    return 'Fintech Visionary';
  }
  if (set.has('tech') && set.has('scifi')) {
    return 'Cybernetic Futurist';
  }
  if (set.has('tech') && set.has('startups')) {
    return 'Silicon Vanguard';
  }
  if (set.has('tech') && set.has('philosophy')) {
    return 'Techno-Philosophic Vanguard';
  }
  if (set.has('fantasy') && set.has('philosophy')) {
    return 'Mythic Contemplative';
  }
  if (set.has('fantasy') && set.has('scifi')) {
    return 'Cosmic Arcanist';
  }
  if (set.has('fantasy') && set.has('mystery')) {
    return 'Mythic Nocturne';
  }
  if (set.has('fantasy') && set.has('classics')) {
    return 'Epic Canonist';
  }
  if (set.has('psychology') && set.has('philosophy')) {
    return 'Existential Introspective';
  }
  if (set.has('psychology') && set.has('business')) {
    return 'Behavioral Strategist';
  }
  if (set.has('psychology') && set.has('selfhelp')) {
    return 'Mindset Architect';
  }
  if (set.has('selfhelp') && set.has('philosophy')) {
    return 'Disciplined Stoic';
  }
  if (set.has('biographies') && set.has('business')) {
    return 'Chronicle Executive';
  }
  if (set.has('biographies') && set.has('startups')) {
    return 'Maverick Builder';
  }
  if (set.has('mystery') && set.has('psychology')) {
    return 'Nocturne Introspective';
  }
  if (set.has('finance') && set.has('startups')) {
    return 'Venture Pragmatist';
  }
  if (set.has('selfhelp') && set.has('business')) {
    return 'High-Performance Strategist';
  }
  if (set.has('classics') && set.has('philosophy')) {
    return 'Classical Dialectic';
  }

  // Dynamic procedural combination
  const primary = CURATED_GENRES.find((g) => g.id === genreIds[0]);
  const secondary = CURATED_GENRES.find((g) => g.id === genreIds[1]);

  if (primary && secondary) {
    const secondPart = secondary.adjective !== primary.adjective ? secondary.adjective : secondary.noun;
    return `${primary.adjective} ${secondPart}`;
  }

  return 'Contemplative Speculative';
};
