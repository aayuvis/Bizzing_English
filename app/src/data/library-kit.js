// Helpers shared by library.js and the files beside it (library-myths.js, library-more.js).
// Rights are as of `checked`. US: published 1930 or earlier. UK/EU: author (and translator)
// died 1955 or earlier (70 years). India: died 1965 or earlier (60 years).
export const CHECKED = '2026-10-02';
export const PG = (n) => `Project Gutenberg #${n} (via the GITenberg mirror)`;
export const pd = (basis, checked = CHECKED) => ({ us: 'PD', uk: 'PD', in: 'PD', basis, checked });
export const r = (us, uk, inn, basis, checked = CHECKED) => ({ us, uk, in: inn, basis, checked });
export const held = (id) => ({ held: true, file: `texts/${id}.txt` });
