import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const robots = readFileSync('public/robots.txt', 'utf8');
const policy = JSON.parse(readFileSync('docs/seo/crawler-access.json', 'utf8'));

function groups(text) {
  const out = new Map();
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const [fieldRaw, ...rest] = line.split(':');
    const field = fieldRaw.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (field === 'user-agent') {
      current = value;
      if (!out.has(current)) out.set(current, []);
      continue;
    }
    if (current && (field === 'allow' || field === 'disallow')) {
      out.get(current).push([field, value]);
    }
  }
  return out;
}

test('robots separates pure training from search and grounding policy', () => {
  const parsed = groups(robots);

  assert.deepEqual(parsed.get('GPTBot'), [['disallow', '/']]);
  assert.deepEqual(parsed.get('ClaudeBot'), [['disallow', '/']]);
  assert.deepEqual(parsed.get('Google-Extended'), [['allow', '/']]);
  assert.deepEqual(parsed.get('*'), [['allow', '/']]);

  assert.match(
    robots,
    /^Sitemap: https:\/\/marketdeck\.in\/sitemap\.xml$/m,
  );
});

test('search and retrieval agents remain covered by wildcard allow', () => {
  const parsed = groups(robots);
  const searchRetrieval = [
    'Googlebot',
    'Bingbot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'Claude-SearchBot',
    'Claude-User',
    'PerplexityBot',
    'Perplexity-User',
  ];

  for (const agent of searchRetrieval) {
    assert.equal(parsed.has(agent), false, agent);
  }

  assert.deepEqual(parsed.get('*'), [['allow', '/']]);
});

test('machine-readable SG-01C policy matches robots policy', () => {
  assert.equal(policy.owner_decisions.search_and_retrieval, 'allow');
  assert.equal(
    policy.owner_decisions.model_training,
    'disallow_GPTBot_and_ClaudeBot',
  );
  assert.equal(
    policy.owner_decisions.google_extended_training_and_grounding,
    'allow',
  );

  const byAgent = new Map(policy.agents.map((entry) => [entry.agent, entry]));

  for (const agent of ['GPTBot', 'ClaudeBot']) {
    assert.equal(byAgent.get(agent)?.purpose, 'model_training');
    assert.equal(
      byAgent.get(agent)?.desired_business_policy,
      'disallow_training',
    );
  }

  const googleExtended = policy.additional_controls.find(
    (entry) => entry.control === 'Google-Extended',
  );
  assert.ok(googleExtended);
  assert.equal(
    googleExtended.desired_business_policy,
    'allow_for_gemini_grounding_and_training_visibility',
  );
});

test('every primary crawler row carries completed live-edge evidence', () => {
  const expectedAgents = [
    'Googlebot',
    'Bingbot',
    'OAI-SearchBot',
    'GPTBot',
    'ChatGPT-User',
    'Claude-SearchBot',
    'ClaudeBot',
    'Claude-User',
    'PerplexityBot',
    'Perplexity-User',
  ];

  assert.deepEqual(policy.agents.map((entry) => entry.agent), expectedAgents);

  for (const entry of policy.agents) {
    assert.equal(entry.last_verified, '2026-09-25');
    assert.match(
      entry.current_live_http_result,
      /^PASS_UA_PROBE_2026-09-25:/,
    );
  }
});

test('edge evidence isolates Python-urllib denial to User-Agent behavior', () => {
  assert.equal(policy.edge_observation.edge, 'cloudflare');
  assert.match(
    policy.edge_observation.classification,
    /User-Agent-based denial/,
  );
  assert.match(
    policy.edge_observation.classification,
    /not a Python\/TLS-stack fingerprint block/,
  );
});

test('Search Console generative AI state remains pending property setup', () => {
  assert.equal(
    policy.search_console_generative_ai_control.marketdeck_property_present,
    false,
  );
  assert.equal(
    policy.search_console_generative_ai_control.property_control_state,
    'not_verifiable_until_property_added_and_verified',
  );
});
