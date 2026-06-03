const MAX_HEARTS = 5;
const DEFAULT_LANGUAGE = 'Spanish';

export type Feedback = {
  type: 'success' | 'error' | 'info';
  message: string;
};

export type Challenge = {
  instruction: string;
  prompt: string;
  answer: string[];
  tiles: string[];
};

export type Lesson = {
  id: string;
  title: string;
  status: 'active' | 'locked' | 'complete';
  label: string;
  challenges: Challenge[];
};

export type LingoTrailState = {
  appName: 'LingoTrail';
  availableLanguages: string[];
  profile: {
    learner: string;
    language: string;
    streak: number;
    hearts: number;
    gems: number;
    xp: number;
    dailyGoal: number;
  };
  lessons: Lesson[];
  quests: {
    id: string;
    label: string;
    progress: number;
    target: number;
  }[];
  leaderboard: {
    name: string;
    xp: number;
  }[];
  session: {
    lessonId: string;
    challengeIndex: number;
    answer: string[];
    feedback: Feedback | null;
  };
};

export function createInitialState(language = DEFAULT_LANGUAGE): LingoTrailState {
  const course = getCourse(language);
  return {
    appName: 'LingoTrail',
    availableLanguages: Object.keys(COURSES),
    profile: {
      learner: 'Avery',
      language: course.language,
      streak: 12,
      hearts: MAX_HEARTS,
      gems: 420,
      xp: 1240,
      dailyGoal: 50,
    },
    lessons: cloneLessons(course.lessons),
    quests: [
      { id: 'quest-1', label: 'Earn 50 XP', progress: 35, target: 50 },
      { id: 'quest-2', label: 'Complete 2 lessons', progress: 1, target: 2 },
      { id: 'quest-3', label: 'Practice mistakes', progress: 0, target: 1 },
    ],
    leaderboard: [
      { name: 'Mina', xp: 1890 },
      { name: 'Avery', xp: 1240 },
      { name: 'Leo', xp: 990 },
    ],
    session: {
      lessonId: course.lessons[0].id,
      challengeIndex: 0,
      answer: [],
      feedback: null,
    },
  };
}

export function switchLanguage(state: LingoTrailState, language: string): LingoTrailState {
  const course = getCourse(language);
  return {
    ...createInitialState(course.language),
    profile: {
      ...state.profile,
      language: course.language,
      hearts: MAX_HEARTS,
    },
    lessons: cloneLessons(course.lessons),
    session: {
      lessonId: course.lessons[0].id,
      challengeIndex: 0,
      answer: [],
      feedback: {
        type: 'info',
        message: `${course.language} course loaded.`,
      },
    },
  };
}

export function getCurrentLesson(state: LingoTrailState) {
  return (
    state.lessons.find((item) => item.id === state.session.lessonId) ??
    state.lessons.find((item) => item.status === 'active') ??
    state.lessons[0]
  );
}

export function getCurrentChallenge(state: LingoTrailState) {
  const lessonItem = getCurrentLesson(state);
  return lessonItem.challenges[state.session.challengeIndex] ?? lessonItem.challenges[0];
}

export function selectWord(state: LingoTrailState, word: string): LingoTrailState {
  const normalized = requireWord(word);
  const challengeItem = getCurrentChallenge(state);
  if (!challengeItem.tiles.includes(normalized)) {
    throw new Error('Word tile is not available for this challenge.');
  }

  return {
    ...state,
    session: {
      ...state.session,
      answer: [...state.session.answer, normalized],
      feedback: null,
    },
  };
}

export function removeLastWord(state: LingoTrailState): LingoTrailState {
  return {
    ...state,
    session: {
      ...state.session,
      answer: state.session.answer.slice(0, -1),
      feedback: null,
    },
  };
}

export function clearAnswer(state: LingoTrailState): LingoTrailState {
  return {
    ...state,
    session: {
      ...state.session,
      answer: [],
      feedback: null,
    },
  };
}

export function answerCurrentChallenge(state: LingoTrailState): LingoTrailState {
  const challengeItem = getCurrentChallenge(state);
  const correct = arraysEqual(state.session.answer, challengeItem.answer);

  if (!correct) {
    return {
      ...state,
      profile: {
        ...state.profile,
        hearts: Math.max(0, state.profile.hearts - 1),
      },
      session: {
        ...state.session,
        feedback: {
          type: 'error',
          message: `Almost. Correct answer: ${challengeItem.answer.join(' ')}`,
        },
      },
    };
  }

  return advanceChallenge({
    ...state,
    profile: {
      ...state.profile,
      xp: state.profile.xp + 15,
      gems: state.profile.gems + 3,
    },
    quests: state.quests.map((questItem) =>
      questItem.id === 'quest-1'
        ? { ...questItem, progress: Math.min(questItem.target, questItem.progress + 15) }
        : questItem
    ),
    session: {
      ...state.session,
      feedback: { type: 'success', message: 'Nice work. Lesson progress saved.' },
    },
  });
}

export function skipChallenge(state: LingoTrailState): LingoTrailState {
  return advanceChallenge({
    ...state,
    session: {
      ...state.session,
      feedback: { type: 'info', message: 'Skipped. Try it again in practice.' },
    },
  });
}

export function calculateProgress(state: LingoTrailState) {
  const completedLessons = state.lessons.filter((item) => item.status === 'complete').length;
  const totalLessons = state.lessons.length;
  return {
    completedLessons,
    totalLessons,
    activeLesson: getCurrentLesson(state).title,
    percent: Math.round((completedLessons / Math.max(totalLessons, 1)) * 100),
  };
}

export function loadState(rawValue: string | null | undefined): LingoTrailState {
  if (!rawValue) return createInitialState();
  try {
    return normalizeState(JSON.parse(rawValue));
  } catch {
    return createInitialState();
  }
}

export function serializeReport(state: LingoTrailState) {
  const progress = calculateProgress(state);
  return {
    generatedAt: new Date().toISOString(),
    appName: state.appName,
    learner: state.profile.learner,
    language: state.profile.language,
    progress,
    profile: state.profile,
    activeLesson: getCurrentLesson(state).title,
    currentPrompt: getCurrentChallenge(state).prompt,
  };
}

function normalizeState(value: unknown): LingoTrailState {
  const fallback = createInitialState();
  if (!value || typeof value !== 'object' || !('appName' in value) || value.appName !== 'LingoTrail') {
    return fallback;
  }

  const candidate = value as Partial<LingoTrailState>;
  const lessons = Array.isArray(candidate.lessons) && candidate.lessons.length ? candidate.lessons : fallback.lessons;
  const activeLesson =
    lessons.find((item) => item.id === candidate.session?.lessonId) ??
    lessons.find((item) => item.status === 'active') ??
    fallback.lessons[0];

  return {
    ...fallback,
    availableLanguages: Object.keys(COURSES),
    profile: {
      ...fallback.profile,
      ...sanitizeProfile(candidate.profile, fallback.profile),
    },
    lessons,
    quests: Array.isArray(candidate.quests) ? candidate.quests : fallback.quests,
    leaderboard: Array.isArray(candidate.leaderboard) ? candidate.leaderboard : fallback.leaderboard,
    session: {
      lessonId: activeLesson.id,
      challengeIndex: clamp(Number(candidate.session?.challengeIndex) || 0, 0, Math.max(activeLesson.challenges.length - 1, 0)),
      answer: Array.isArray(candidate.session?.answer) ? candidate.session.answer.map(String) : [],
      feedback: candidate.session?.feedback ?? null,
    },
  };
}

function sanitizeProfile(value: Partial<LingoTrailState['profile']> | undefined, fallback: LingoTrailState['profile']) {
  return {
    learner: cleanText(value?.learner, fallback.learner, 32),
    language: cleanText(value?.language, fallback.language, 32),
    streak: clamp(Number(value?.streak) || fallback.streak, 0, 999),
    hearts: clamp(Number(value?.hearts) || fallback.hearts, 0, MAX_HEARTS),
    gems: clamp(Number(value?.gems) || fallback.gems, 0, 999999),
    xp: clamp(Number(value?.xp) || fallback.xp, 0, 999999),
    dailyGoal: clamp(Number(value?.dailyGoal) || fallback.dailyGoal, 1, 500),
  };
}

function advanceChallenge(state: LingoTrailState): LingoTrailState {
  const activeLesson = getCurrentLesson(state);
  const nextChallengeIndex = state.session.challengeIndex + 1;
  if (nextChallengeIndex < activeLesson.challenges.length) {
    return {
      ...state,
      session: {
        ...state.session,
        challengeIndex: nextChallengeIndex,
        answer: [],
      },
    };
  }

  const activeLessonIndex = state.lessons.findIndex((item) => item.id === activeLesson.id);
  const nextLesson = state.lessons[activeLessonIndex + 1];
  const lessons = state.lessons.map((item, index) => {
    if (index === activeLessonIndex) return { ...item, status: 'complete' as const };
    if (nextLesson && index === activeLessonIndex + 1 && item.status === 'locked') {
      return { ...item, status: 'active' as const };
    }
    return item;
  });

  return {
    ...state,
    lessons,
    quests: state.quests.map((questItem) =>
      questItem.id === 'quest-2'
        ? { ...questItem, progress: Math.min(questItem.target, questItem.progress + 1) }
        : questItem
    ),
    session: {
      lessonId: nextLesson?.id ?? activeLesson.id,
      challengeIndex: 0,
      answer: [],
      feedback: {
        type: 'success',
        message: nextLesson ? `${nextLesson.title} unlocked.` : 'Course checkpoint complete.',
      },
    },
  };
}

function lesson(
  id: string,
  title: string,
  status: Lesson['status'],
  label: string,
  challenges: Challenge[]
): Lesson {
  return { id, title, status, label, challenges };
}

function challenge(instruction: string, prompt: string, answer: string[], tiles: string[]): Challenge {
  return { instruction, prompt, answer, tiles };
}

function requireWord(word: string) {
  const normalized = String(word ?? '').trim().toLocaleLowerCase();
  if (!normalized) throw new Error('Word tile is required.');
  return normalized;
}

function getCourse(language: string) {
  const course = COURSES[String(language ?? '').trim() as keyof typeof COURSES];
  if (!course) {
    throw new Error(`Language is not supported. Choose one of: ${Object.keys(COURSES).join(', ')}.`);
  }
  return course;
}

function cloneLessons(lessons: Lesson[]) {
  return lessons.map((item) => ({
    ...item,
    challenges: item.challenges.map((challengeItem) => ({
      ...challengeItem,
      answer: [...challengeItem.answer],
      tiles: [...challengeItem.tiles],
    })),
  }));
}

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function cleanText(value: unknown, fallback: string, limit: number) {
  const text = String(value ?? '').trim();
  return (text || fallback).slice(0, limit);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const COURSES = {
  Spanish: {
    language: 'Spanish',
    lessons: [
      lesson('spanish-basics-1', 'Basics 1', 'active', 'Hola', [
        challenge('Translate this sentence', 'I drink water', ['yo', 'bebo', 'agua'], ['yo', 'bebo', 'agua', 'pan', 'leche']),
        challenge('Translate this sentence', 'Bread, please', ['pan', 'por', 'favor'], ['pan', 'agua', 'por', 'favor', 'yo']),
        challenge('Translate this sentence', 'I drink milk', ['yo', 'bebo', 'leche'], ['yo', 'bebo', 'agua', 'leche', 'pan']),
      ]),
      lesson('spanish-food-1', 'Food', 'locked', 'Agua', [
        challenge('Translate this sentence', 'I am Ava', ['yo', 'soy', 'ava'], ['yo', 'soy', 'ava', 'bebo', 'agua']),
      ]),
      lesson('spanish-travel-1', 'Travel', 'locked', 'Taxi', [
        challenge('Translate this sentence', 'Where is the station?', ['donde', 'esta', 'la', 'estacion'], ['donde', 'esta', 'la', 'playa', 'estacion']),
      ]),
      lesson('spanish-stories-1', 'Story', 'locked', 'Cafe', [
        challenge('Translate this sentence', 'The coffee is hot', ['el', 'cafe', 'esta', 'caliente'], ['el', 'cafe', 'frio', 'esta', 'caliente']),
      ]),
      lesson('spanish-practice-1', 'Practice', 'locked', 'Review', [
        challenge('Translate this sentence', 'I want water', ['yo', 'quiero', 'agua'], ['yo', 'quiero', 'agua', 'pan', 'soy']),
      ]),
      lesson('spanish-checkpoint-1', 'Checkpoint', 'locked', 'Gate', [
        challenge('Translate this sentence', 'I speak Spanish', ['yo', 'hablo', 'espanol'], ['yo', 'hablo', 'bebo', 'espanol', 'agua']),
      ]),
    ],
  },
  Hebrew: {
    language: 'Hebrew',
    lessons: [
      lesson('hebrew-alefbet-1', 'Alef-Bet', 'active', 'שלום', [
        challenge('Translate this sentence', 'I drink water', ['אני', 'שותה', 'מים'], ['אני', 'שותה', 'מים', 'לחם', 'חלב']),
        challenge('Translate this sentence', 'Bread, please', ['לחם', 'בבקשה'], ['לחם', 'מים', 'בבקשה', 'אני', 'חלב']),
        challenge('Translate this sentence', 'I drink milk', ['אני', 'שותה', 'חלב'], ['אני', 'שותה', 'מים', 'חלב', 'לחם']),
      ]),
      lesson('hebrew-food-1', 'Food', 'locked', 'מים', [
        challenge('Translate this sentence', 'I am Ava', ['אני', 'אווה'], ['אני', 'אווה', 'שותה', 'מים', 'שלום']),
      ]),
      lesson('hebrew-travel-1', 'Travel', 'locked', 'מונית', [
        challenge('Translate this sentence', 'Where is the station?', ['איפה', 'התחנה'], ['איפה', 'התחנה', 'הים', 'מים', 'שלום']),
      ]),
      lesson('hebrew-stories-1', 'Story', 'locked', 'קפה', [
        challenge('Translate this sentence', 'The coffee is hot', ['הקפה', 'חם'], ['הקפה', 'חם', 'קר', 'מים', 'לחם']),
      ]),
      lesson('hebrew-practice-1', 'Practice', 'locked', 'Review', [
        challenge('Translate this sentence', 'I want water', ['אני', 'רוצה', 'מים'], ['אני', 'רוצה', 'מים', 'לחם', 'שותה']),
      ]),
      lesson('hebrew-checkpoint-1', 'Checkpoint', 'locked', 'שער', [
        challenge('Translate this sentence', 'I speak Hebrew', ['אני', 'מדבר', 'עברית'], ['אני', 'מדבר', 'שותה', 'עברית', 'מים']),
      ]),
    ],
  },
};
