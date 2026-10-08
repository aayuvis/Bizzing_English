/* miss.js — ONE miss card for every game (handover C §1.6; CLAUDE.md: "a wrong answer holds until
   dismissed and explains on the exact item"). missCard(item, given) returns the held item with the answer
   shown IN PLACE — the commas missed in green and the extra ones struck out; the right sentence (both
   orders when both are right); the words that make a figure lit; the line as the author wrote it — the
   reason in one kind line, and one Continue (data-act="miss-go", or Enter). The view puts it where the
   item was, so the answer stands on the item, never beside the next one. Pure strings, so test/games.mjs
   can hold it to that. */

import { esc, icon } from './ui.js';

export const RULE_TEXT = {
  list: 'Commas separate the things in a list.',
  fronted: 'A comma follows an opening word or phrase.',
  address: 'A comma sets off the name of the person spoken to.',
  aside: 'Commas fence off an aside: words you could lift out.',
  compound: 'A comma comes before “and”, “but” or “so” when they join two whole sentences.',
  yesno: 'A comma follows “yes”, “no” or “well” at the start.',
};

/* the corrected sentence: a comma the child left out is inserted in green; one they put in wrongly is struck out */
function commasInPlace(item, sel = []) {
  const want = new Set(item.commas), got = new Set(sel);
  return item.words.map((w, i) => {
    const gap = i < item.words.length - 1 ? (want.has(i) && got.has(i) ? '<b class="miss-keep">,</b>' : want.has(i) ? '<ins class="miss-fix" title="a comma goes here">,</ins>' : got.has(i) ? '<del class="miss-del" title="no comma here">,</del>' : '') : '';
    return `<span class="miss-w">${esc(w)}${gap}</span>`;
  }).join(' ');
}
/* the right sentence, with the capital and the commas lit as the fix */
const lit = (s) => esc(s).replace(/^(\S)/, '<ins class="miss-fix">$1</ins>').replace(/,/g, '<ins class="miss-fix">,</ins>');
function wordsInPlace(item, sel = []) {
  const want = new Set(item.want || []), got = new Set(sel);
  return item.tokens.map((t, i) => `<span class="miss-w${want.has(i) ? ' miss-fix' : got.has(i) ? ' miss-del' : ''}">${esc(t)}</span>`).join(' ');
}

/* item.type: 'commas' { words, commas, rule } · given: the gaps chosen
              'sentence' { right: [front, end], why } · given: the sentence built
              'words' { tokens, want, why } · given: the words tapped
              'line' { right, why } · given: the line built
              'spot' { sentences, at, why } · given: the sentence tapped
              'choice' { options, answer, why } · given: the option picked (the options stay marked in place) */
export function missCard(item, given, o = {}) {
  const title = o.title || 'Not quite — here it is';
  let body = '', why = item.why || '';
  if (item.type === 'commas') { body = `<p class="miss-item miss-sent">${commasInPlace(item, given)}</p>`; why = why || RULE_TEXT[item.rule] || ''; }
  else if (item.type === 'sentence') {
    const [a, b] = item.right;
    body = `${given ? `<p class="miss-given"><span>You built</span> <del class="miss-del">${esc(given)}</del></p>` : ''}<p class="miss-item miss-sent">${lit(a)}</p>${b && b !== a ? `<p class="miss-item miss-sent miss-alt"><span>or</span> ${lit(b)}</p>` : ''}`;
  }
  else if (item.type === 'words') body = `<p class="miss-item miss-sent">${wordsInPlace(item, given)}</p>`;
  else if (item.type === 'line') body = `${given ? `<p class="miss-given"><span>You built</span> <del class="miss-del">${esc(given)}</del></p>` : ''}<p class="miss-item miss-sent"><ins class="miss-fix">${esc(item.right)}</ins></p>`;
  else if (item.type === 'spot') body = `<p class="miss-item miss-sent"><ins class="miss-fix">${esc(item.sentences[item.at])}</ins></p>`;
  else if (item.type === 'choice') body = `<p class="miss-item"><span class="miss-label">The answer</span> <ins class="miss-fix">${esc(item.options[item.answer])}</ins>${given != null && given !== item.answer ? ` — not <del class="miss-del">${esc(item.options[given])}</del>` : ''}</p>`;
  return `<div class="miss" role="alert" data-miss="${esc(item.type)}"><div class="miss-hd">${icon('cross')}<b>${esc(title)}</b></div>${body}${why ? `<p class="miss-why">${o.whyHtml ? why : esc(why)}</p>` : ''}
    <div class="miss-acts"><button class="btn miss-go" data-act="miss-go" autofocus>${icon('next')}<span>${esc(o.go || 'Continue')}</span></button></div></div>`;
}
