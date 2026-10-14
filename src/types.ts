export type Language = "python" | "cpp" | "shell";
export interface Profile {
  name: string;
  language: Language;
  dailyGoal: number;
  skin: string;
  mascotVersion?:1;
  avatarFrame?: string;
  activeCourse?: string;
  settings?: { sound?: boolean; reducedMotion?: boolean };
}
export interface Progress {
  passed: boolean;
  bestKnowledge: number;
  mistakes: number;
  nextReview?: number;
}
export interface AppState {
  activeCourse?: string;
  courses?: Record<string, any>;
  level?: { level: number; xpIntoLevel: number; xpForNext: number; progress: number; totalXp: number; capped: boolean };
  rewardEvents?: any[];
  consumables?: Record<string, number>;
  activeBoost?: { itemId: string; charges: number; totalCharges: number } | null;
  lastReward?:{id:string;xp:number;baseXp:number;bonusXp:number;gems:number;courseId?:string|null};
  avatarFrames?: string[];
  profile: Profile;
  xp: number;
  gems: number;
  energy: number;
  streak: number;
  freeze: number;
  inventory: string[];
  claimed: string[];
  badges: string[];
  progress: Record<string, Progress>;
  completed: number;
  reviewDue: number;
  courseScore: number;
  capstoneUnlocked: boolean;
  capstonePassed: boolean;
  capstoneScore: number;
  today: string;
  daily: Record<
    string,
    { xp: number; lessons: number; reviews: number; codes: number }
  >;
  quests: Quest[];
  leagueRows: LeagueRow[];
  tierName: string;
  league: { tier: number; week: string; history: any[] };
}
export interface Quest {
  id: string;
  title: string;
  current: number;
  target: number;
  icon: string;
}
export interface LeagueRow {
  id: string;
  name: string;
  xp: number;
  avatar: number;
  isBot: boolean;
  rank: number;
}
export interface LessonSummary {
  id: number;
  title: string;
  kind: string;
  pack: string;
  unitId: number;
  duration: string;
  problemIds: string[];
  unlocked: boolean;
  progress: Progress | null;
}
export interface Unit {
  id: number;
  title: string;
  subtitle: string;
  range: number[];
  color: string;
  icon: string;
}
export interface Course {
  id: string;
  title: string;
  version: string;
  lessons: LessonSummary[];
  units: Unit[];
  description?: string;
  mandatoryCount?: number;
  advancedCount?: number;
  languages?: Language[];
  completed?: number;
  capstoneTitle?: string;
  runtime?: string;
  icon?: string;
  sourceCount?: number;
  tagline?: string;
}
export interface Question {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  input?: unknown;
  problemId?: string;
  answerId?: string;
  explanation?: string;
}
export interface Attempt {
  courseId?: string;
  id: string;
  lessonId: number;
  mode: string;
  status: string;
  questions: Question[];
  answers: Record<string, string>;
  codeDrafts: Record<string, Partial<Record<Language, string>>>;
  codesPassed: string[];
  requiredProblems: string[];
  jobIds: string[];
  result: any;
  updatedAt: number;
  seed: string;
  essay?: Record<string, string>;
  customTests?: any[];
  tasks?: Record<string, unknown>;
  feedback?: any;
  lab?: any;
  learningCursor?: { phase: string; block: number };
}
export interface Problem {
  id: string;
  title: string;
  statement: string;
  constraints: string;
  sampleInput: unknown;
  sampleOutput: unknown;
  hints: string[];
  starters: Partial<Record<Language, string>>;
}
export interface Lesson extends LessonSummary {
  objectives: string[];
  blocks: {
    title: string;
    text: string;
    label: string;
    code?: Partial<Record<Language, string>>;
    problemId?: string;
    commandSnippet?: string;
  }[];
  steps: string[];
  sources: any[];
  corrections: any[];
  problems: Problem[];
  helpers: Partial<Record<Language, string>>;
  visualization?: string | { kind: string; problemId?: string; initial?: any; commands?: string[]; caption?: string };
  visualData?: any;
  recall?: { prompt: string; options: string[]; answer: string };
  itinerary?: { title: string; minutes: number }[];
}
