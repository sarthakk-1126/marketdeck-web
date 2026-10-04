import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { answerQuestion, categories, faqs, normalize, searchFaqs } from '../src/lens-knowledge.js';

test('all curated questions return their own answer and safe internal links', () => {
  assert.equal(new Set(faqs.map(f => f.id)).size, faqs.length);
  for (const faq of faqs) {
    assert.ok(categories.includes(faq.category));
    assert.equal(answerQuestion(faq.question).answer, faq.answer, faq.question);
    for (const item of faq.links ?? []) {
      assert.match(item.href, /^\/(?!\/)/);
      if (item.href.startsWith('/intelligence/') || item.href.startsWith('/research-standards/')) {
        assert.ok(existsSync(`public${item.href}index.html`), `Missing published guide ${item.href}`);
      }
    }
  }
});
test('known companies use the actual product resolvers, including name aliases', () => {
  for (const query of ['Where can I research TCS?', 'open tata consultancy services', 'TCS.NS']) {
    const reply = answerQuestion(query);
    assert.equal(reply.context.company, 'TCS');
    assert.equal(reply.links[0].href, '/screener/search/?q=TCS');
    assert.equal(reply.links[1].href, '/charts/jump/?symbol_input=TCS');
  }
  assert.equal(answerQuestion('How do I research INFY?').context.company, 'Infosys');
});
test('unknown and ambiguous names route to choices without invented company facts', () => {
  const reply = answerQuestion('Adani Enterprises');
  assert.equal(reply.links[0].href, '/screener/search/?q=Adani%20Enterprises');
  assert.match(reply.answer, /choose from the matches/);
  assert.equal(answerQuestion('Show me a chart of Adani Enterprises').context.company, 'Adani Enterprises');
  assert.equal(answerQuestion('TCS and Infosys').context.awaitingCompany, true);
  assert.equal(answerQuestion('compare TCS vs Infosys').links[0].href, '/screener/compare/');
});
test('company follow-ups are supported without leaking context into unrelated answers', () => {
  const start = answerQuestion('Research a company');
  assert.equal(start.context.awaitingCompany, true);
  const company = answerQuestion('Asian Paints', start.context);
  assert.equal(company.context.company, 'Asian Paints');
  assert.equal(answerQuestion('its chart', company.context).context.company, 'Asian Paints');
  assert.equal(answerQuestion('What is ROE?', company.context).id, 'roe');
  assert.deepEqual(answerQuestion('Where does the data come from?', company.context).context, {});
});
test('advice, live-data and concept intents take precedence over company shortcuts', () => {
  assert.equal(answerQuestion('Should I buy TCS?').id, 'advice');
  assert.equal(answerQuestion('latest prices for TCS').id, 'freshness');
  assert.equal(answerQuestion('What is the PE ratio of Infosys?').id, 'pe');
  assert.equal(answerQuestion('forgot password for TCS research').id, 'password');
  assert.equal(answerQuestion('What can you do?').id, 'lens');
});
test('FAQ search supports synonyms, categories, partial text and empty results', () => {
  assert.equal(searchFaqs('').length, faqs.length);
  assert.ok(searchFaqs('login').some(f => f.id === 'account'));
  assert.ok(searchFaqs('volat').some(f => f.id === 'iv'));
  assert.ok(searchFaqs('market cap').some(f => f.id === 'marketcap'));
  assert.ok(searchFaqs('', 'Tools').every(f => f.category === 'Tools'));
  assert.deepEqual(searchFaqs('zxq987noresult'), []);
  assert.deepEqual(answerQuestion('Browse FAQs'), { view: 'faqs' });
});
test('malformed input is bounded, cannot create executable URLs and fails honestly', () => {
  assert.equal(answerQuestion('   '), null);
  const reply = answerQuestion('<img src=x onerror=alert(1)>');
  assert.match(reply.answer, /don’t have a verified answer/);
  assert.equal(reply.links[0].href, '/research-standards/');
  assert.match(answerQuestion('Can you order pizza for me?').answer, /don’t have a verified answer/);
  const result = answerQuestion('find Abc & Co');
  assert.equal(result.links[0].href, '/screener/search/?q=Abc%20%26%20Co');
  assert.equal(normalize('  What’s   ROE? '), 'whats roe');
});
test('Lens ships independently of the hero and keeps transcripts in memory', () => {
  const script = readFileSync('src/lens.js', 'utf8');
  const html = readFileSync('public/index.html', 'utf8');
  assert.doesNotMatch(script, /innerHTML|fetch\(|localStorage|sessionStorage|eval\(/);
  assert.match(script, /showModal\(/);
  assert.match(script, /childElementCount > 20/);
  assert.match(html, /aria-haspopup="dialog" aria-controls="marketdeck-lens" aria-expanded="false" hidden/);
  assert.match(html, /data-lens-transcript role="log"/);
  assert.equal((html.match(/<form\b/g) ?? []).length, 1);
});
