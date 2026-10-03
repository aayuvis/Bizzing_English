/* report.mjs — "what to help with next" always names specifics, and certificates come only from evidence. */
import './_mem.mjs';
import { demoHousehold } from '../src/demo.js';
import { helpNext } from '../src/report.js';
import { certificates, certSVG } from '../src/certificates.js';
import { newHousehold, newKid, addKid } from '../src/model.js';
let n = 0, fails = 0; const ok = (c, m) => { n++; if (!c) { fails++; console.log('✗', m); } };

const h = demoHousehold(), k = h.kids[0], help = helpNext(h, k);
ok(help.length >= 2, 'the sample child gets at least two things to help with: ' + help.length);
ok(help.every((x) => /“[^”]+”/.test(x.text) && x.href && x.href.startsWith('#/')), 'every line names its stop in quotes and links somewhere specific');
ok(help.some((x) => /slipped/.test(x.text)), 'the honest slip (s1-adj) is named');
ok(help.every((x) => !/nothing needs help/i.test(x.text)), 'never “nothing needs help”');
const fresh = newHousehold(), c = addKid(fresh, newKid('Lu', 1, 'hare')), h2 = helpNext(fresh, c);
ok(h2.length >= 1 && /Next on the road/.test(h2.at(-1).text), 'a brand-new child is still told the exact next stop');

const certs = certificates(k);
ok(certs.some((x) => x.id === 'word-1'), 'the sample has its Word level 1 certificate (every stop passed)');
ok(!certs.some((x) => x.id === 'word-5'), 'no certificate without the evidence');
ok(certificates(c).length === 0, 'a new child has none');
const svg = certSVG(certs[0], 'Kavya', '3 October 2026');
ok(svg.includes('Kavya') && svg.includes(certs[0].title.replace(/&/g, '&amp;')) && svg.startsWith('<svg'), 'the certificate names the child and the level');
ok(certSVG({ ...certs[0], title: '<b>x</b>' }, '<i>', 'd').includes('&lt;i&gt;'), 'the certificate escapes what it draws');
console.log(fails ? `report: ${fails} FAILED of ${n}` : `report: all ${n} passed`); if (fails) process.exit(1);
