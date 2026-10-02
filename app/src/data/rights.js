/* rights.js — SPEC §3: a text ships only when ALL THREE markets clear it (US: published 1930 or
   earlier; UK/EU: author and translator dead 70+ years; India: 60+). The app never asks where a
   child is, so there is no locale to gate by: a work marked 'check' or 'not PD' in any market is
   held back from every child — its full text stays out of the published site (tools/texts/gated/),
   its passages and lines are not served — and its card says why, until the rights are confirmed. */
export const cleared = (w) => !!w && w.rights?.us === 'PD' && w.rights?.uk === 'PD' && w.rights?.in === 'PD';
