/**
 * DJ Skill Service
 *
 * Persona-based DJ assistants that run on whichever AI provider is
 * available (NVIDIA → Kimi → local LLM, see aiProviderChain). Each skill
 * owns its system prompt and expected JSON shape; the chain handles
 * routing and fallback.
 */

import { runAiJson, isAiChainConfigured, type AiProviderId } from './aiProviderChain';

export interface DjSkill {
  name: string;
  description: string;
  systemPrompt: string;
}

export const DJ_SKILLS: Record<string, DjSkill> = {
  setlist_curator: {
    name: 'Setlist Curator',
    description:
      'Builds harmonically-mixed setlists from a seed track, respecting BPM and key compatibility (Camelot wheel).',
    systemPrompt: `You are a senior club DJ. Given a seed track, propose 5 follow-up tracks ordered for energy progression.
Reply ONLY with a JSON array of objects: { "title": string, "artist": string, "bpm": number, "key": string, "reason": string }.`,
  },
  crowd_reader: {
    name: 'Crowd Reader',
    description:
      'Translates an environment description into the right musical move (genre, BPM band, mood).',
    systemPrompt: `You are a veteran festival DJ. Read the room described and recommend a single transition.
Reply ONLY with JSON: { "genre": string, "bpm_target": number, "mood": string, "advice": string }.`,
  },
  mix_coach: {
    name: 'Mix Coach',
    description:
      'Reviews two tracks playing on Deck A and Deck B and suggests crossfader/EQ moves.',
    systemPrompt: `You are an instructor for digital DJing. Given the current Deck A and Deck B states,
recommend the next 8-bar move. Reply ONLY with JSON: { "action": string, "eq": { "bass": "cut|boost|hold", "mid": "cut|boost|hold", "treble": "cut|boost|hold" }, "crossfader": "A|center|B", "reason": string }.`,
  },
};

export interface SkillRunOptions {
  skillId: keyof typeof DJ_SKILLS;
  userPrompt: string;
  maxTokens?: number;
  agentBriefing?: string;
  prefer?: AiProviderId;
}

export interface SkillRunResult<T> {
  data: T;
  provider: AiProviderId;
  model: string;
}

export const runDjSkill = async <T = unknown>({
  skillId,
  userPrompt,
  maxTokens = 1024,
  agentBriefing,
  prefer,
}: SkillRunOptions): Promise<SkillRunResult<T>> => {
  const skill = DJ_SKILLS[skillId];
  if (!skill) throw new Error(`Unknown DJ skill: ${skillId}`);

  const system = agentBriefing
    ? `${skill.systemPrompt}\n\nThe user has rated other AI agent personas. Lean toward TRUSTED personas' style, avoid the AVOID personas' patterns:\n\n${agentBriefing}`
    : skill.systemPrompt;

  return runAiJson<T>({
    feature: `dj-skill:${String(skillId)}`,
    maxTokens,
    prefer,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
  });
};

export const isDjSkillConfigured = (): boolean => isAiChainConfigured();
