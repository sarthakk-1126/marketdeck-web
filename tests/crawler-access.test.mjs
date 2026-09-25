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

test('robots explicitly allows approved search and retrieval agents', () => {
  const parsed = groups(robots);
  const expected = [
    'Googlebot',
    'Bingbot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'Claude-SearchBot',
    'Claude-User',
    'PerplexityBot',
    'Perplexity-User',
  ];

  for (const agent of expected) {
    assert.deepEqual(parsed.get(agent), [['allow', '/']], agent);
  }

  assert.deepEqual(parsed.get('*'), [['allow', '/']]);
  assert.match(robots, /^Sitemap: https:\/\/marketdeck\.in\/sitemap\.xml$/m);
});

test('machine-readable policy separates search/retrieval from training', () => {
  assert.equal(policy.canonical_origin, 'https://marketdeck.in');
  assert.equal(policy.sitemap, 'https://marketdeck.in/sitemap.xml');
  assert.equal(policy.owner_decisions.search_and_retrieval, 'allow');
  assert.equal(
    policy.owner_decisions.model_training,
    'pending_explicit_owner_decision_preserve_existing_allow',
  );

  const byAgent = new Map(policy.agents.map((entry) => [entry.agent, entry]));

  for (const agent of ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot']) {
    assert.equal(byAgent.get(agent)?.purpose, 'search_index');
    assert.equal(byAgent.get(agent)?.search_or_retrieval, true);
    assert.equal(byAgent.get(agent)?.training, false);
    assert.equal(byAgent.get(agent)?.robots_policy, 'allow');
  }

  for (const agent of ['ChatGPT-User', 'Claude-User', 'Perplexity-User']) {
    assert.equal(byAgent.get(agent)?.purpose, 'user_initiated_retrieval');
    assert.equal(byAgent.get(agent)?.search_or_retrieval, true);
    assert.equal(byAgent.get(agent)?.training, false);
    assert.equal(byAgent.get(agent)?.robots_policy, 'allow');
  }

  for (const agent of ['GPTBot', 'ClaudeBot']) {
    assert.equal(byAgent.get(agent)?.purpose, 'model_training');
    assert.equal(byAgent.get(agent)?.search_or_retrieval, false);
    assert.equal(byAgent.get(agent)?.training, true);
    assert.equal(byAgent.get(agent)?.robots_policy, 'wildcard_preserve_existing');
    assert.equal(byAgent.get(agent)?.desired_business_policy, 'pending_explicit_owner_training_decision');
  }
});

test('every primary crawler row carries the SG-01 evidence fields', () => {
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

  const required = [
    'provider',
    'purpose',
    'search_or_retrieval',
    'training',
    'robots_token',
    'identity_verification',
    'current_marketdeck_robots_policy',
    'current_live_http_result',
    'desired_business_policy',
    'required_change',
    'official_source',
    'evidence_note',
    'last_verified',
  ];

  for (const entry of policy.agents) {
    for (const field of required) {
      assert.ok(Object.hasOwn(entry, field), `${entry.agent}: missing ${field}`);
    }
    assert.equal(entry.last_verified, '2026-09-25');
    assert.equal(entry.current_live_http_result, 'pending_sg_01a_vps_edge_gate');
  }
});

test('training crawlers are not accidentally given dedicated robots groups', () => {
  const parsed = groups(robots);
  assert.equal(parsed.has('GPTBot'), false);
  assert.equal(parsed.has('ClaudeBot'), false);
});

test('Google-Extended remains a separate pending owner control', () => {
  const googleExtended = policy.additional_controls.find((entry) => entry.control === 'Google-Extended');
  assert.ok(googleExtended);
  assert.equal(googleExtended.training_or_grounding, true);
  assert.equal(googleExtended.search_inclusion_or_ranking, false);
  assert.equal(
    googleExtended.desired_business_policy,
    'pending_explicit_owner_training_and_grounding_decision',
  );
});
