import { hasApiKey } from './apiKeyManager';
import { getPreferredModel } from './modelCatalog';
import { recordUsage } from './usageTracker';
import { getAnthropicClient } from './anthropicClient';
import { extractJsonObject } from '../utils/jsonExtract';

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
  rick_rubin: {
    name: 'Rick Rubin · Reductionist',
    description:
      'A Zen producer voice. Strips a mix down to its truth — what to remove, what to honor, what the song is really trying to say.',
    systemPrompt: `You are channeling Rick Rubin: a quiet, attentive producer who believes the song already exists and your job is to uncover it.
You speak in short, calm sentences. You avoid jargon. You ask what is essential and what is decoration.
You favor space, restraint, raw emotion, and a single moment that hits. You distrust over-production and clutter.

Given a description of a track, mix, or set, respond ONLY with JSON of the shape:
{ "essence": string, "remove": string[], "honor": string[], "one_moment": string, "mantra": string }
- "essence" — one sentence on what the song is actually about (sonically and emotionally).
- "remove" — up to 3 things to strip away (a layer, a frequency, a busy section).
- "honor" — up to 3 things to protect or amplify (a vocal breath, a kick, silence).
- "one_moment" — the single moment in the arrangement that should land hardest.
- "mantra" — one short Rubin-style line, under 12 words.`,
  },
};

export interface SkillRunOptions {
  skillId: keyof typeof DJ_SKILLS;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  agentBriefing?: string;
}

export const runDjSkill = async <T = unknown>({
  skillId,
  userPrompt,
  model,
  maxTokens = 1024,
  agentBriefing,
}: SkillRunOptions): Promise<T> => {
  const skill = DJ_SKILLS[skillId];
  if (!skill) throw new Error(`Unknown DJ skill: ${skillId}`);
  const resolvedModel = model ?? getPreferredModel('anthropic');

  const client = getAnthropicClient();
  const system = agentBriefing
    ? `${skill.systemPrompt}\n\nThe user has rated other AI agent personas. Lean toward TRUSTED personas' style, avoid the AVOID personas' patterns:\n\n${agentBriefing}`
    : skill.systemPrompt;
  const response = await client.messages.create({
    model: resolvedModel,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userPrompt }],
  });

  recordUsage({
    provider: 'anthropic',
    model: resolvedModel,
    feature: `claude:${String(skillId)}`,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock && 'text' in textBlock ? textBlock.text.trim() : '';
  try {
    return extractJsonObject(raw) as T;
  } catch (err) {
    console.error('Claude DJ skill parse error. Raw response:', raw, err);
    throw new Error('The Claude DJ agent returned an invalid response format.');
  }
};

export const isClaudeConfigured = (): boolean => hasApiKey('anthropic');
