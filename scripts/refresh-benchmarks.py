#!/usr/bin/env python3
# coding: utf-8
"""Refresh the public benchmark snapshot. No API keys or runtime polling."""
import concurrent.futures
import datetime
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://slopalytics.com/'
FAMILIES = {
    'claude-opus-5-5': 'anthropic/claude-opus-5.5',
    'claude-sonnet-5-5': 'anthropic/claude-sonnet-5.5',
    'claude-fable-5-1': 'anthropic/claude-fable-5.1',
    'claude-haiku-5-5': 'anthropic/claude-haiku-5.5',
    'gpt-6-1-sol': 'openai/gpt-6.1-sol',
    'gpt-6-astra': 'openai/gpt-6-astra',
    'gpt-6-luna': 'openai/gpt-6-luna',
    'gemini-4-argon': 'google/gemini-4-argon',
    'grok-4-7': 'xai/grok-4.7',
    'muse-wonder': 'meta/muse-wonder',
    'mistral-large-4': 'mistral/mistral-large-4',
}


def download(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Alphy benchmark snapshot (+https://alphy.chat)'})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read().decode('utf-8')


def public_models(bundle):
    start = bundle.index('models:[{', bundle.index('fetchedAt:')) + 7
    depth, quote, escaped = 0, None, False
    for end in range(start, len(bundle)):
        char = bundle[end]
        if quote:
            if escaped:
                escaped = False
            elif char == '\\':
                escaped = True
            elif char == quote:
                quote = None
        elif char in '\"\x27`':
            quote = char
        elif char == '[':
            depth += 1
        elif char == ']':
            depth -= 1
            if not depth:
                break
    else:
        raise ValueError('Unclosed public model snapshot')
    literal = re.sub(r'`([^`\\]*(?:\\.[^`\\]*)*)`', lambda m: json.dumps(m.group(1)), bundle[start:end+1])
    literal = re.sub(r'([{,])(\w+):', r'\1"\2":', literal).replace('!0', 'true').replace('!1', 'false')
    literal = re.sub(r':(-?)\.(\d)', r':\g<1>0.\2', literal)
    # Parse data only. Never evaluate the remote JavaScript.
    return json.loads(literal)


def aa_details(html):
    chunks = []
    for match in re.finditer(r'self\.__next_f\.push\((.*?)\)</script>', html, re.S):
        try:
            value = json.loads(match.group(1))
            if len(value) > 1 and isinstance(value[1], str):
                chunks.append(value[1])
        except (json.JSONDecodeError, TypeError):
            continue
    found = {}

    def walk(value):
        if isinstance(value, dict):
            if 'intelligenceIndexCostPerTask' in value and value.get('slug'):
                found[value['slug']] = value
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    for frame in ''.join(chunks).splitlines():
        try:
            walk(json.loads(frame.split(':', 1)[-1]))
        except json.JSONDecodeError:
            continue
    return found


def profile(detail, cost):
    if not cost:
        return None
    source_rates = {
        'input': detail.get('price1mInputTokens'),
        'output': detail.get('price1mOutputTokens'),
        'cacheRead': detail.get('cacheHitPrice'),
        # A cache write without a dedicated fee is billed at the input rate.
        'cacheWrite': detail.get('cacheWritePrice') or detail.get('price1mInputTokens'),
    }
    components = {'input': cost.get('nonCacheInput'), 'output': cost.get('output'),
                  'cacheRead': cost.get('cacheRead'), 'cacheWrite': cost.get('cacheWrite')}
    result = {}
    for key, amount in components.items():
        if amount is None:
            raise ValueError('Missing cost component: ' + key)
        if amount and not source_rates[key]:
            raise ValueError('Missing source rate: ' + key)
        result[key] = amount / source_rates[key] if amount else 0
    total = sum(components.values())
    if abs(total - cost['total']) > max(1e-6, cost['total'] * 1e-6):
        raise ValueError('Cost breakdown does not sum to total')
    return result


def main():
    home = download(SOURCE)
    script = re.search(r'<script[^>]+src="([^"]+\.js)"', home).group(1)
    from urllib.parse import urljoin
    bundle = download(urljoin(SOURCE, script))
    models = [m for m in public_models(bundle) if m['family'] in FAMILIES and not m['deprecated'] and m['intelligence'] is not None]
    if set(m['family'] for m in models) != set(FAMILIES):
        raise ValueError('Incomplete model coverage; keeping the existing snapshot')
    first = aa_details(download('https://artificialanalysis.ai/models/claude-opus-5-5'))
    missing = [m for m in models if m['id'] not in first]
    print(f'{len(models)} variants; collecting {len(missing)} additional primary-source pages', flush=True)

    def collect(model):
        url = 'https://artificialanalysis.ai/models/' + model['id']
        records = aa_details(download(url))
        if model['id'] not in records:
            raise ValueError('Primary-source record missing: ' + model['id'])
        return records

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for records in pool.map(collect, missing):
            first.update(records)
    points = []
    for model in models:
        detail = first[model['id']]
        task = profile(detail, (detail.get('intelligenceIndexCostPerTask') or {}).get('cost'))
        total = profile(detail, detail.get('intelligenceIndexCost'))
        if task is None or total is None:
            raise ValueError('Cost profile missing: ' + model['id'])
        points.append({
            'id': model['id'], 'model': FAMILIES[model['family']], 'name': model['name'],
            'effort': model['effort'], 'effortOrder': model['effortOrder'],
            'fallback': 'fallback' in model['variant'].lower(),
            'intelligence': model['intelligence'], 'tokens': model['tokens'],
            'tokensTotal': model['tokensTotal'], 'time': model['time'],
            'taskProfile': task, 'totalProfile': total,
        })
    points.sort(key=lambda p: (list(FAMILIES.values()).index(p['model']), p['effortOrder']))
    snapshot = {
        'date': datetime.datetime.now(datetime.timezone.utc).astimezone(datetime.timezone(datetime.timedelta(hours=3))).date().isoformat(),
        'source': SOURCE,
        'methodology': 'https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index',
        'points': points,
    }
    text = '// Public benchmark facts. Refreshed with scripts/refresh-benchmarks.py.\nexport const BENCHMARK_DATA = ' + json.dumps(snapshot, ensure_ascii=False, allow_nan=False, separators=(',', ':')) + ';\n'
    target = ROOT / 'cdn' / 'benchmarks-data.js'
    temporary = target.with_suffix('.tmp')
    temporary.write_text(text, encoding='utf-8')
    temporary.replace(target)
    print(f'Saved {len(points)} variants in {len(text.encode())} bytes', flush=True)


if __name__ == '__main__':
    main()
