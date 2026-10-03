/* writing.js — what a program may honestly say about a child's writing (SPEC §6), and nothing more.

   1. SHAPES for sentence imitation: a small parser over simple patterns — "starts with When…, then a
      comma, then the main clause", "a list of three", "a simile" — so "write your own sentence in this
      shape" can be checked for its SHAPE. The screen says it checked the shape, never the meaning.
   2. COUNTS for the writing desk: sentences, words, average length, how many different ways the
      sentences open, paragraphs, and words from the child's own word bank used. They are labelled as
      counts, never as a mark. Quality is judged by a grown-up's rubric behind the PIN.
   Free writing never leaves the device and is never analysed anywhere else (SPEC §6.3). */

const words = (s) => (String(s).match(/[A-Za-z][A-Za-z'’-]*/g) || []);
/* split at an end mark followed by a capital — but never after Mr. Mrs. Dr. St. (Mr. McGregor is one man) */
export const sentences = (t) => String(t).replace(/\s+/g, ' ').trim().split(/(?<!\b(?:Mr|Mrs|Dr|St|Mt|Messrs)\.)(?<=[.!?][’”"']?)\s+(?=[A-Z“"‘'])/).map((x) => x.trim()).filter((x) => words(x).length);

export const SHAPES = {
  opener: { name: 'Begins with a joining word', say: 'starts with a word like When, After, Because or Although, then a comma, then the main part',
    test: (s) => /^(When|While|After|Before|As soon as|If|Because|Although|Though|Until|Since|Once|Whenever)\b[^,]{3,},\s+[a-zA-Z]/.test(s) },
  list3: { name: 'A list of three', say: 'has three things in a row: “this, that and the other”',
    test: (s) => /\b[A-Za-z'’-]+(?: [A-Za-z'’-]+){0,3}, [A-Za-z'’-]+(?: [A-Za-z'’-]+){0,3},? (and|or) [A-Za-z'’-]+/.test(s) },
  simile: { name: 'A simile', say: 'compares one thing to another with “as … as” or “like a …”',
    test: (s) => /\bas [a-z]+ as (a|an|the|my|his|her|their|any)\b/i.test(s) || /\blike (a|an|the|some|two|ten)\b/i.test(s) },
  but: { name: 'Two halves joined', say: 'has two complete halves joined by a comma and “but”, “so” or “yet”',
    test: (s) => /^[^,]{6,}, (but|so|yet) [a-z]+ [a-z]+/.test(s) },
  fronted: { name: 'An -ly opener', say: 'starts with a word ending in -ly, then a comma',
    test: (s) => /^[A-Z][a-z]{3,}ly, [a-zA-Z]/.test(s) && !/^(Polly|Molly|Sally|Holly|Dolly|Emily|Lily|Lilly|Billy|Kelly|Elly|Nelly|Bully|Shelly|Jolly)\b/.test(s) },
  question: { name: 'A question', say: 'asks something, and ends with a question mark',
    test: (s) => /\?[’”"']?$/.test(s) && /^(Who|What|Where|When|Why|How|Which|Whose|Is|Are|Was|Were|Do|Does|Did|Can|Could|Will|Would|Shall|Should|Have|Has|Had|May|Might|Must)\b/.test(s) },
};

/* A sentence of the child's own: a capital, an end mark, five words or more, the shape, and not a copy
   of the model (no more than 60% of its words shared). Returns { ok, why }. */
export function imitate(shape, model, text) {
  const s = String(text || '').trim(), S = SHAPES[shape];
  if (words(s).length < 5) return { ok: false, why: 'Write a whole sentence — five words or more.' };
  if (!/^[A-Z“"‘']/.test(s)) return { ok: false, why: 'Start with a capital letter.' };
  if (!/[.!?][’”"']?$/.test(s)) return { ok: false, why: 'End with a full stop, a question mark or an exclamation mark.' };
  if (sentences(s).length > 1) return { ok: false, why: 'Just one sentence.' };
  if (!S.test(s)) return { ok: false, why: `Not quite the shape yet: the model ${S.say}.` };
  const mw = new Set(words(model).map((w) => w.toLowerCase())), cw = words(s).map((w) => w.toLowerCase());
  if (cw.filter((w) => mw.has(w)).length / cw.length > 0.6) return { ok: false, why: 'That is very close to the model — make it about your own subject.' };
  return { ok: true, why: `Your sentence ${S.say}. (The app checked the shape, not the meaning.)` };
}

/* The desk's counts. bank: the child's word bank (an object keyed by word). */
export function counts(text, bank = {}) {
  const t = String(text || ''), ss = sentences(t), ws = words(t);
  const openers = new Set(ss.map((s) => (words(s)[0] || '').toLowerCase()).filter(Boolean));
  const used = [...new Set(ws.map((w) => w.toLowerCase()).filter((w) => bank[w]))];
  return { sentences: ss.length, words: ws.length, avg: ss.length ? Math.round((ws.length / ss.length) * 10) / 10 : 0,
    openers: openers.size, paragraphs: t.split(/\n\s*\n/).filter((p) => p.trim()).length, bankUsed: used };
}
