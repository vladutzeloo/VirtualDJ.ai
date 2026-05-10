import Anthropic from '@anthropic-ai/sdk';
import { getApiKey, hasApiKey, markKeyUsed } from './apiKeyManager';
import { recordUsage } from './usageTracker';

let clientInstance: Anthropic | null = null;
let clientInstanceKey: string | null = null;

const getClient = (): Anthropic => {
  const apiKey = getApiKey('anthropic');
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it via the Neural Vault or your environment.',
    );
  }
  if (!clientInstance || clientInstanceKey !== apiKey) {
    clientInstance = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    clientInstanceKey = apiKey;
  }
  markKeyUsed('anthropic');
  return clientInstance;
};

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
  model?: string;
  maxTokens?: number;
  agentBriefing?: string;
}

export const runDjSkill = async <T = unknown>({
  skillId,
  userPrompt,
  model = 'claude-sonnet-4-6',
  maxTokens = 1024,
  agentBriefing,
}: SkillRunOptions): Promise<T> => {
  const skill = DJ_SKILLS[skillId];
  if (!skill) throw new Error(`Unknown DJ skill: ${skillId}`);

  const client = getClient();
  const system = agentBriefing
    ? `${skill.systemPrompt}\n\nThe user has rated other AI agent personas. Lean toward TRUSTED personas' style, avoid the AVOID personas' patterns:\n\n${agentBriefing}`
    : skill.systemPrompt;
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userPrompt }],
  });

  recordUsage({
    provider: 'anthropic',
    model,
    feature: `claude:${String(skillId)}`,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock && 'text' in textBlock ? textBlock.text.trim() : '';
  const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('Claude DJ skill parse error. Raw response:', raw, err);
    throw new Error('The Claude DJ agent returned an invalid response format.');
  }
};

export const isClaudeConfigured = (): boolean => hasApiKey('anthropic');
