/**
 * Best-effort JSON extraction for AI completions.
 *
 * Models frequently wrap output in ```json fences or include a short prose
 * preface even when instructed not to. These helpers strip fences, then fall
 * back to slicing the first/last bracket pair before throwing.
 */

const stripFences = (raw: string): string => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : raw).trim();
};

const sliceBetween = (raw: string, open: string, close: string): string | null => {
  const start = raw.indexOf(open);
  const end = raw.lastIndexOf(close);
  if (start === -1 || end === -1 || end <= start) return null;
  return raw.slice(start, end + 1);
};

export const extractJsonArray = (raw: string): unknown => {
  const candidate = stripFences(raw);
  try {
    return JSON.parse(candidate);
  } catch {
    const sliced = sliceBetween(candidate, '[', ']');
    if (sliced) return JSON.parse(sliced);
    throw new Error('Model did not return parseable JSON array');
  }
};

export const extractJsonObject = (raw: string): unknown => {
  const candidate = stripFences(raw);
  try {
    return JSON.parse(candidate);
  } catch {
    const sliced = sliceBetween(candidate, '{', '}');
    if (sliced) return JSON.parse(sliced);
    throw new Error('Model did not return parseable JSON object');
  }
};
