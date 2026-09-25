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

test('robots preserves the simple production wildcard allow policy', () => {
  const parsed = groups(robots);
  assert.deepEqual([...parsed.keys()], ['*']);
  assert.deepEqual(parsed.get('*'), [['allow', '/']]);
  assert.match(robots, /^Sitemap: https:\/\/marketdeck\.in\/sitemap\.xml$/m);
});

test('machine-readable policy separates search/retrieval from training', () => {
  assert.equal(policy.canonical_origin, 'https://marketdeck.in');
  assert.equal(policy.sitemap, 'https://marketdeck.in/sitemap.xml');
  assert.equal(policy.owner_decisions.search_and_retrieval, 'allow_no_robots_change_required');
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
    assert.match(entry.current_live_http_result, /^PASS_UA_PROBE_2026-09-25:/);
  }
});

test('edge evidence isolates Python-urllib denial to User-Agent behavior', () => {
  assert.equal(policy.edge_observation.edge, 'cloudflare');
  assert.equal(policy.edge_observation.paths.length, 3);
  assert.match(policy.edge_observation.classification, /User-Agent-based denial/);
  assert.match(policy.edge_observation.classification, /not a Python\/TLS-stack fingerprint block/);
});

test('no dedicated crawler group is needed merely to restate wildcard access', () => {
  const parsed = groups(robots);
  for (const agent of [
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
  ]) {
    assert.equal(parsed.has(agent), false, agent);
  }
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
