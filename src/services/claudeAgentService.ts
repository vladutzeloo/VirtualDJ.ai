import Anthropic from '@anthropic-ai/sdk';

let clientInstance: Anthropic | null = null;

const getClient = (): Anthropic => {
  if (!clientInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Add it to your environment to enable the Claude DJ agent.',
      );
    }
    clientInstance = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
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
}

export const runDjSkill = async <T = unknown>({
  skillId,
  userPrompt,
  model = 'claude-sonnet-4-6',
  maxTokens = 1024,
}: SkillRunOptions): Promise<T> => {
  const skill = DJ_SKILLS[skillId];
  if (!skill) throw new Error(`Unknown DJ skill: ${skillId}`);

  const client = getClient();
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: skill.systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock && 'text' in textBlock ? textBlock.text.trim() : '';
  const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, '');
  return JSON.parse(cleaned) as T;
};

export const isClaudeConfigured = (): boolean => {
  return Boolean(process.env.ANTHROPIC_API_KEY);
};
