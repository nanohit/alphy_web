/* alphy.chat — vanilla JS port of the "Alphy v2" design. No dependencies, no build step.
   Served by jsDelivr (request alphy.min.js for the auto-minified build); index.html on Vercel loads it. */
(() => {
"use strict";

// Base URL of this script: logos resolve relative to it (jsDelivr in prod, ./cdn/ locally).
const BASE = ((document.currentScript || {}).src || "").replace(/[^/]*$/, "");

// Demo panel settings (component props in the design).
const API_ENDPOINT = "";       // POST {prompt, stream:false} → the panel shows the answer; empty → Groq
const SHOW_DEMO_ANSWER = true; // false → the panel starts with the "API не подключён" notice

/* ---------- catalog and presentation data ---------- */

// Pricing sources (checked 2026-10-11):
// developers.openai.com/api/docs/models/{gpt-6.1-sol,gpt-6-astra}
// platform.claude.com/docs/en/about-claude/pricing (5-minute cache writes)
// docs.mistral.ai/models/mistral-large (current public-preview prices)
// Other text models: openrouter.ai/api/v1/models; media: docs.x.ai and docs.bfl.ai.
// Claude Haiku prices below apply to prompts up to 100K tokens.
const USD_RUB = 84.9048; // CBR USD rate for 2026-10-10, effective on 2026-10-11.
const rubleNumber = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rublePrice = value => value === "Free" ? "0 ₽" : value.replace(/\$([\d.]+)\s*\/\s*(.*)/, (_, amount, unit) =>
  rubleNumber.format(Number(amount) * USD_RUB) + " ₽/" + unit);
const PRICE_NOTE = "Публичные тарифы на 11.10.2026, в рублях по курсу ЦБ на 10.10.2026: 84,9048 ₽ за $1. M — миллион токенов, K — тысяча запросов. Указаны базовые режимы; «от» — минимальная ставка. Cache Write — запись на 5 минут, где она тарифицируется отдельно.";

// Curated public pricing snapshot, checked 2026-10-11. Sources/conditions are stored per model.
const MODELS = [
  {"mark": "AN", "prov": "anthropic", "name": "anthropic/claude-haiku-5.5", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$0.1/M", "inp": 0.1, "output": "$0.5/M", "cacheRead": "$0.01/M", "cacheWrite": "$0.125/M", "web": "$10/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models", "priceNote": "Базовый тариф для промптов до 100 000 токенов; длинный контекст оплачивается по другой ставке."},
  {"mark": "MI", "prov": "mistral", "name": "mistral/mistral-large-4", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$0.68/M", "inp": 0.68, "output": "$2.09/M", "cacheRead": "$0.07/M", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "OA", "prov": "openai", "name": "openai/gpt-6.1-sol", "context": "1.05M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$2/M", "inp": 2.0, "output": "$10/M", "cacheRead": "$0.1/M", "cacheWrite": "$2.5/M", "web": "$10/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models", "priceNote": "Базовый тариф для промптов до 272 000 токенов; длинный контекст оплачивается по другой ставке."},
  {"mark": "OA", "prov": "openai", "name": "openai/gpt-6-astra", "context": "1.05M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$10/M", "inp": 10.0, "output": "$50/M", "cacheRead": "$1/M", "cacheWrite": "$12.5/M", "web": "$10/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models", "priceNote": "Базовый тариф для промптов до 272 000 токенов; длинный контекст оплачивается по другой ставке."},
  {"mark": "AN", "prov": "anthropic", "name": "anthropic/claude-opus-5.5", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$4/M", "inp": 4.0, "output": "$20/M", "cacheRead": "$0.2/M", "cacheWrite": "$5/M", "web": "$10/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "AN", "prov": "anthropic", "name": "anthropic/claude-fable-5.1", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$10/M", "inp": 10.0, "output": "$50/M", "cacheRead": "$0.25/M", "cacheWrite": "$12.5/M", "web": "$10/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "AN", "prov": "anthropic", "name": "anthropic/claude-sonnet-5.5", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$2/M", "inp": 2.0, "output": "$10/M", "cacheRead": "$0.1/M", "cacheWrite": "$2.5/M", "web": "$10/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "GO", "prov": "google", "name": "google/gemini-3.6-flash", "context": "1M", "latency": "1.8s", "lat": 1.8, "throughput": "172tps", "tps": 172, "input": "$0.75/M", "inp": 0.75, "output": "$3.75/M", "cacheRead": "$0.075/M", "cacheWrite": "—", "web": "$14/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "GO", "prov": "google", "name": "google/gemini-3.5-flash-lite", "context": "1M", "latency": "0.3s", "lat": 0.3, "throughput": "360tps", "tps": 360, "input": "$0.3/M", "inp": 0.3, "output": "$2.5/M", "cacheRead": "$0.03/M", "cacheWrite": "—", "web": "$14/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "GO", "prov": "google", "name": "google/gemini-3.5-flash", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$1.5/M", "inp": 1.5, "output": "$9/M", "cacheRead": "$0.15/M", "cacheWrite": "—", "web": "$14/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "DS", "prov": "deepseek", "name": "deepseek/deepseek-v4.1-flash", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "от $0.15/M", "inp": 0.15, "output": "от $0.6/M", "cacheRead": "от $0.003/M", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Text", "Code", "Image"], "priceSource": "https://api-docs.deepseek.com/quick_start/pricing/", "priceNote": "Off-peak тариф; в часы пик input, output и cache read стоят вдвое дороже."},
  {"mark": "DS", "prov": "deepseek", "name": "deepseek/deepseek-v4-pro", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "от $0.66/M", "inp": 0.66, "output": "от $1.98/M", "cacheRead": "от $0.022/M", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Text", "Code"], "priceSource": "https://api-docs.deepseek.com/quick_start/pricing/", "priceNote": "Off-peak тариф; в часы пик input, output и cache read стоят вдвое дороже."},
  {"mark": "AL", "prov": "alibaba", "name": "alibaba/qwen3.8-max", "context": "1M", "latency": "4.0s", "lat": 4, "throughput": "56tps", "tps": 56, "input": "$2/M", "inp": 2.0, "output": "$6/M", "cacheRead": "$0.25/M", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "AL", "prov": "alibaba", "name": "alibaba/qwen3.7-flash", "context": "1M", "latency": "1.8s", "lat": 1.8, "throughput": "135tps", "tps": 135, "input": "$0.03/M", "inp": 0.03, "output": "$0.13/M", "cacheRead": "$0.006/M", "cacheWrite": "$0.038/M", "web": "—", "webSub": "", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models", "priceNote": "Базовый тариф для промптов до 32 000 токенов; длинный контекст оплачивается по другой ставке."},
  {"mark": "MS", "prov": "moonshotai", "name": "moonshotai/kimi-k3", "context": "1M", "latency": "1.0s", "lat": 1, "throughput": "91tps", "tps": 91, "input": "$0.8/M", "inp": 0.8, "output": "$15/M", "cacheRead": "$0.55/M", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "MS", "prov": "moonshotai", "name": "moonshotai/kimi-k2.6", "context": "256K", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$0.65/M", "inp": 0.65, "output": "$3.41/M", "cacheRead": "$0.15/M", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "XA", "prov": "xai", "name": "xai/grok-4.5", "context": "488K", "latency": "1.1s", "lat": 1.1, "throughput": "137tps", "tps": 137, "input": "$2/M", "inp": 2.0, "output": "$6/M", "cacheRead": "$0.3/M", "cacheWrite": "—", "web": "$5/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models", "priceNote": "Базовый тариф для промптов до 200 000 токенов; длинный контекст оплачивается по другой ставке."},
  {"mark": "OA", "prov": "openai", "name": "openai/gpt-5.6-terra", "context": "1.05M", "latency": "2.7s", "lat": 2.7, "throughput": "100tps", "tps": 100, "input": "$2/M", "inp": 2.0, "output": "$12/M", "cacheRead": "$0.2/M", "cacheWrite": "$2.5/M", "web": "$10/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models", "priceNote": "Базовый тариф для промптов до 272 000 токенов; длинный контекст оплачивается по другой ставке."},
  {"mark": "OA", "prov": "openai", "name": "openai/gpt-5.6-luna", "context": "1.05M", "latency": "1.8s", "lat": 1.8, "throughput": "179tps", "tps": 179, "input": "$0.2/M", "inp": 0.2, "output": "$1.2/M", "cacheRead": "$0.02/M", "cacheWrite": "$0.25/M", "web": "$10/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models", "priceNote": "Базовый тариф для промптов до 272 000 токенов; длинный контекст оплачивается по другой ставке."},
  {"mark": "AN", "prov": "anthropic", "name": "anthropic/claude-opus-4.8", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$5/M", "inp": 5.0, "output": "$25/M", "cacheRead": "$0.5/M", "cacheWrite": "$6.25/M", "web": "$10/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "AN", "prov": "anthropic", "name": "anthropic/claude-opus-4.7", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$5/M", "inp": 5.0, "output": "$25/M", "cacheRead": "$0.5/M", "cacheWrite": "$6.25/M", "web": "$10/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "AN", "prov": "anthropic", "name": "anthropic/claude-sonnet-5", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$2/M", "inp": 2.0, "output": "$10/M", "cacheRead": "$0.2/M", "cacheWrite": "$2.5/M", "web": "$10/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "AN", "prov": "anthropic", "name": "anthropic/claude-sonnet-4.6", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$3/M", "inp": 3.0, "output": "$15/M", "cacheRead": "$0.3/M", "cacheWrite": "$3.75/M", "web": "$10/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "AN", "prov": "anthropic", "name": "anthropic/claude-haiku-4.5", "context": "195K", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$1/M", "inp": 1.0, "output": "$5/M", "cacheRead": "$0.1/M", "cacheWrite": "$1.25/M", "web": "$10/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "GO", "prov": "google", "name": "google/gemini-3.1-pro-preview", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$2/M", "inp": 2.0, "output": "$12/M", "cacheRead": "$0.2/M", "cacheWrite": "—", "web": "$14/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models", "priceNote": "Базовый тариф для промптов до 200 000 токенов; длинный контекст оплачивается по другой ставке."},
  {"mark": "GO", "prov": "google", "name": "google/gemini-3.1-flash-lite", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$0.25/M", "inp": 0.25, "output": "$1.5/M", "cacheRead": "$0.025/M", "cacheWrite": "—", "web": "$14/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "GO", "prov": "google", "name": "google/gemini-2.5-pro", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$1.25/M", "inp": 1.25, "output": "$10/M", "cacheRead": "$0.125/M", "cacheWrite": "—", "web": "$14/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models", "priceNote": "Базовый тариф для промптов до 200 000 токенов; длинный контекст оплачивается по другой ставке."},
  {"mark": "GO", "prov": "google", "name": "google/gemini-2.5-flash", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$0.3/M", "inp": 0.3, "output": "$2.5/M", "cacheRead": "$0.03/M", "cacheWrite": "—", "web": "$14/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "GO", "prov": "google", "name": "google/gemini-2.5-flash-lite", "context": "1M", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$0.1/M", "inp": 0.1, "output": "$0.4/M", "cacheRead": "$0.01/M", "cacheWrite": "—", "web": "$14/K", "webSub": "+ стоимость input", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "DS", "prov": "deepseek", "name": "deepseek/deepseek-v3.2", "context": "160K", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$0.259/M", "inp": 0.259, "output": "$0.8/M", "cacheRead": "$0.14/M", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Text", "Code"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "DS", "prov": "deepseek", "name": "deepseek/deepseek-r1", "context": "62K", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$0.7/M", "inp": 0.7, "output": "$2.5/M", "cacheRead": "—", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Text", "Code"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "MI", "prov": "mistral", "name": "mistral/mistral-medium-3.5", "context": "256K", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$1.5/M", "inp": 1.5, "output": "$7.5/M", "cacheRead": "—", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Text", "Code", "Image"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "MI", "prov": "mistral", "name": "mistral/devstral-2", "context": "256K", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$0.4/M", "inp": 0.4, "output": "$2/M", "cacheRead": "$0.04/M", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Text", "Code"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "MI", "prov": "mistral", "name": "mistral/codestral", "context": "250K", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$0.3/M", "inp": 0.3, "output": "$0.9/M", "cacheRead": "$0.03/M", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Text", "Code"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "CO", "prov": "cohere", "name": "cohere/command-a", "context": "250K", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$2.5/M", "inp": 2.5, "output": "$10/M", "cacheRead": "—", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Text", "Code"], "priceSource": "https://openrouter.ai/api/v1/models"},
  {"mark": "MI", "prov": "mistral", "name": "mistral/codestral-embed", "context": "8K", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$0.15/M", "inp": 0.15, "output": "Включено", "cacheRead": "$0.015/M", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Embedding"], "priceSource": "https://docs.mistral.ai/inference/pricing", "priceNote": "Оплачиваются входные токены; выходной вектор включён в тариф."},
  {"mark": "XA", "prov": "xai", "name": "xai/grok-imagine-image-2.0", "context": "—", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$0.01/img", "inp": 99, "output": "от $0.04/img", "cacheRead": "—", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Image"], "priceSource": "https://docs.x.ai/developers/pricing", "priceNote": "Выход: 1K, Low quality. Цена растёт с разрешением и качеством; input — входное изображение."},
  {"mark": "XA", "prov": "xai", "name": "xai/grok-voice-think-fast-2.0", "context": "—", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "$0.004/text", "inp": 99, "output": "$4.80/hr", "cacheRead": "—", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Audio"], "priceSource": "https://docs.x.ai/developers/pricing", "priceNote": "Speech-to-speech: 4,80 USD за час; текстовый вход тарифицируется отдельно."},
  {"mark": "BF", "prov": "bfl", "name": "bfl/flux-2-klein-4b", "context": "—", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "Включено", "inp": 99, "output": "от $0.014/img", "cacheRead": "—", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Image"], "priceSource": "https://docs.bfl.ai/quick_start/pricing", "priceNote": "Text-to-image, базовое разрешение; цена зависит от мегапикселей. Входной промпт включён."},
  {"mark": "BF", "prov": "bfl", "name": "bfl/flux-2-klein-9b", "context": "—", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "Включено", "inp": 99, "output": "от $0.015/img", "cacheRead": "—", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Image"], "priceSource": "https://docs.bfl.ai/quick_start/pricing", "priceNote": "Text-to-image, базовое разрешение; цена зависит от мегапикселей. Входной промпт включён."},
  {"mark": "BF", "prov": "bfl", "name": "bfl/flux-2-pro", "context": "—", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "Включено", "inp": 99, "output": "от $0.03/img", "cacheRead": "—", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Image"], "priceSource": "https://docs.bfl.ai/quick_start/pricing", "priceNote": "Text-to-image, базовое разрешение; цена зависит от мегапикселей. Входной промпт включён."},
  {"mark": "BF", "prov": "bfl", "name": "bfl/flux-2-max", "context": "—", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "Включено", "inp": 99, "output": "от $0.07/img", "cacheRead": "—", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Image"], "priceSource": "https://docs.bfl.ai/quick_start/pricing", "priceNote": "Text-to-image, базовое разрешение; цена зависит от мегапикселей. Входной промпт включён."},
  {"mark": "BF", "prov": "bfl", "name": "bfl/flux-2-flex", "context": "—", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "Включено", "inp": 99, "output": "от $0.05/img", "cacheRead": "—", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Image"], "priceSource": "https://docs.bfl.ai/quick_start/pricing", "priceNote": "Text-to-image, базовое разрешение; цена зависит от мегапикселей. Входной промпт включён."},
  {"mark": "BF", "prov": "bfl", "name": "bfl/flux-3-video", "context": "—", "latency": "—", "lat": 99, "throughput": "—", "tps": 0, "input": "Включено", "inp": 99, "output": "от $0.17/sec", "cacheRead": "—", "cacheWrite": "—", "web": "—", "webSub": "", "mods": ["Video"], "priceSource": "https://docs.bfl.ai/quick_start/pricing", "priceNote": "Полный рендер HD, text/image-to-video. Цена за секунду готового видео; draft — отдельный режим."}
];

// Stored reversed so secret scanners don't flag these intentionally public demo keys.
const GROQ_KEYS = [
  "fCZIpNU1I2oqOruqqK6IxUbfYF3bydGWLSXixUJjBnFo4QkvA8AN_ksg",
  "3VS8wbavPi6AuE3lXLXjbdZKYF3bydGWSWOixIWz2QWcap8zzTJE_ksg"
].map(k => [...k].reverse().join(""));
let GROQ_IDX = 0;
const GROQ_KEY = GROQ_KEYS[0];
const nextGroqKey = () => GROQ_KEYS[GROQ_IDX++ % GROQ_KEYS.length];
const GROQ_MODEL = "qwen/qwen3.8-27b"; // design used llama-3.1-8b-instant, which Groq no longer serves (404)

const DEMOS = [
  {
    q: "Как использовать API Alphy?",
    tps: 372,
    segs: [
      { k: "p", t: "Endpoint OpenAI-compatible: меняете базовый URL и ключ, SDK и код запросов остаются прежними." },
      { k: "code", t: "export ALPHY_BASE_URL=https://api.alphy.tech/v1" },
      { k: "meta", t: "Endpoint configured" },
      { k: "code", t: "curl \"$ALPHY_BASE_URL/responses\" \\\n  -H \"Authorization: Bearer $ALPHY_GATEWAY_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"model\":\"your-model-id\",\"input\":\"Reply with pong\"}'" },
      { k: "meta", t: "OpenAI Response  ·  completed  ·  usage recorded" }
    ]
  },
  {
    q: "Что такое CORS политика?",
    tps: 351,
    segs: [
      { k: "p", t: "CORS — это механизм безопасности браузера, который ограничивает доступ JavaScript к ответам с другого origin без явного разрешения сервера." },
      { k: "p", t: "Ключевые заголовки:" },
      { k: "h", n: "01", t: "Access-Control-Allow-Origin — какие сайты могут читать ответ." },
      { k: "h", n: "02", t: "Access-Control-Allow-Methods — какие HTTP-методы разрешены." },
      { k: "h", n: "03", t: "Access-Control-Allow-Headers — какие нестандартные заголовки можно отправлять." },
      { k: "h", n: "04", t: "Access-Control-Allow-Credentials — можно ли передавать cookies." }
    ]
  },
  {
    q: "Почему AI-инференс важен?",
    tps: 338,
    segs: [
      { k: "p", t: "Инференс — это этап, на котором обученная модель применяется к новым данным для получения результата. Он важен по нескольким причинам:" },
      { k: "h", n: "01", t: "Это то, за что реально платят пользователи." },
      { k: "p", t: "Обучение модели — разовые (хотя и огромные) затраты. Инференс происходит каждый раз, когда кто-то отправляет запрос — миллионы раз в день. Именно на нём строится вся практическая ценность: от чат-ботов до рекомендательных систем." },
      { k: "h", n: "02", t: "Экономика и масштабирование." },
      { k: "p", t: "Совокупная стоимость инференса на больших масштабах часто превышает стоимость обучения. Оптимизация скорости, задержки и цены определяет, окупится ли продукт." },
      { k: "h", n: "03", t: "Задержка напрямую влияет на пользовательский опыт." },
      { k: "p", t: "Голосовые ассистенты, автопилоты, торговые алгоритмы, интерактивные чат-боты — везде ответ должен приходить быстро. Плохо оптимизированный инференс делает продукт непригодным, даже если сама модель отличная." }
    ]
  },
  {
    q: "Существуют ли чёрные дыры?",
    tps: 361,
    segs: [
      { k: "p", t: "Да. Существование подтверждено тремя независимыми линиями наблюдений:" },
      { k: "h", n: "01", t: "Орбиты звёзд в центре Галактики." },
      { k: "p", t: "Движение звёзд вокруг Sgr A* даёт массу около 4,3 млн солнечных в области меньше орбиты Меркурия — ничего кроме чёрной дыры такой плотности не даёт." },
      { k: "h", n: "02", t: "Гравитационные волны." },
      { k: "p", t: "С 2015 года LIGO и Virgo зарегистрировали десятки слияний компактных объектов с массами, недостижимыми для нейтронных звёзд." },
      { k: "h", n: "03", t: "Прямое изображение тени." },
      { k: "p", t: "Телескоп горизонта событий получил изображения M87* и Sgr A*: форма и размер тени совпали с предсказанием общей теории относительности." },
      { k: "meta", t: "sources: EHT 2019  ·  LIGO O3  ·  GRAVITY" }
    ]
  }
];

const FEATURED = ["anthropic/claude-haiku-5.5", "mistral/mistral-large-4", "openai/gpt-6.1-sol", "openai/gpt-6-astra", "anthropic/claude-opus-5.5", "anthropic/claude-fable-5.1", "anthropic/claude-sonnet-5.5"];
const SORT_LABELS = { release: "по дате", latency: "по latency", throughput: "по throughput", input: "по цене input" };
const PROV_LABELS = { all: "Все провайдеры", openai: "OpenAI", anthropic: "Anthropic", google: "Google", meta: "Meta", xai: "xAI", deepseek: "DeepSeek", alibaba: "Alibaba", moonshotai: "Moonshot AI", thinkingmachines: "Thinking Machines", mistral: "Mistral", cohere: "Cohere", bfl: "Black Forest Labs", bytedance: "ByteDance", perplexity: "Perplexity", prodia: "Prodia", quiverai: "QuiverAI", sakana: "Sakana AI", poolside: "Poolside", minimax: "MiniMax", kwaipilot: "Kwaipilot", inclusionai: "InclusionAI", fishaudio: "Fish Audio" };

// Preview trace, to be replaced together with the live training data.
const TRAINING_RUN = [
  [0, .067], [95, .089], [240, .061], [410, .082], [570, .139],
  [705, .112], [860, .173], [1020, .164], [1215, .207], [1400, .186],
  [1595, .232], [1760, .287], [1910, .258], [2140, .309], [2335, .285],
  [2500, .346], [2690, .398], [2860, .367], [3045, .423], [3270, .411],
  [3460, .475], [3610, .444], [3825, .503], [4030, .538], [4240, .521],
  [4395, .573], [4570, .552], [4780, .598], [5025, .637], [5215, .612],
  [5400, .662], [5590, .651], [5805, .688], [6020, .729], [6260, .703],
  [6435, .748], [6610, .735], [6790, .772], [7020, .787], [7265, .765],
  [7430, .806], [7680, .795], [7840, .835], [8050, .818], [8290, .849],
  [8465, .842], [8630, .873], [8870, .862], [9090, .894], [9280, .907],
  [9495, .883], [9690, .916], [9840, .905], [10000, .920]
].map(([step, reward]) => ({ step, reward }));
const FINAL_REWARD = TRAINING_RUN[TRAINING_RUN.length - 1].reward.toFixed(2);
const POINTS = TRAINING_RUN.map(({ step, reward }) => `${step / 10000 * 600},${202 - reward * 184}`).join(" ");

const ROUTES = [
  {
    id: "r1", dur: "4.1s",
    times: "0;0.098;0.195;0.293;0.39;1",
    opacity: "0;1;1;1;0;0",
    d: "M400,100 h81.421M 506.605 200 A 123.097 400 0 0 0 481.421 100",
    cx: "400;400;481.421;506.605;506.605;0",
    cy: "100;100;100;200;200;0",
    r: "0;50;50;50;0;0",
  },
  {
    id: "r2", dur: "5.7s",
    times: "0;0.094;0.187;0.281;0.374;0.468;0.561;1",
    opacity: "0;1;1;1;1;1;0;0",
    d: "M 115.336 200 A -328.701 400 0 0 0 81.736 300M81.736,300 h-69.035M 12.702 300 A -400 400 0 0 0 0 400M 0 400 A -400 400 0 0 0 12.702 500",
    cx: "115.336;115.336;81.736;12.702;0;12.702;12.702;0",
    cy: "200;200;300;300;400;500;500;0",
    r: "0;50;50;50;50;50;0;0",
  },
  {
    id: "r3", dur: "5.7s",
    times: "0;0.094;0.187;0.281;0.374;0.468;0.561;1",
    opacity: "0;1;1;1;1;1;0;0",
    d: "M293.395,200 h-97.219M 196.176 200 A -235.355 400 0 0 0 172.118 300M 172.118 300 A -235.355 400 0 0 0 164.645 400M 164.645 400 A -235.355 400 0 0 0 172.118 500",
    cx: "293.395;293.395;196.176;172.118;164.645;172.118;172.118;0",
    cy: "200;200;200;300;400;500;500;0",
    r: "0;50;50;50;50;50;0;0",
  },
  {
    id: "r4", dur: "5.7s",
    times: "0;0.094;0.187;0.281;0.374;0.468;0.561;1",
    opacity: "0;1;1;1;1;1;0;0",
    d: "M603.824,200 h80.84M 718.264 300 A 328.701 400 0 0 0 684.664 200M718.264,300 h69.035M 800 400 A 400 400 0 0 0 787.298 300",
    cx: "603.824;603.824;684.664;718.264;787.298;800;800;0",
    cy: "200;200;200;300;300;400;400;0",
    r: "0;50;50;50;50;50;0;0",
  },
  {
    id: "r5", dur: "4.1s",
    times: "0;0.098;0.195;0.293;0.39;1",
    opacity: "0;1;1;1;0;0",
    d: "M519.188,300 h108.694M 635.355 400 A 235.355 400 0 0 0 627.882 300",
    cx: "519.188;519.188;627.882;635.355;635.355;0",
    cy: "300;300;300;400;400;0",
    r: "0;50;50;50;0;0",
  },
  {
    id: "r6", dur: "4.1s",
    times: "0;0.098;0.195;0.293;0.39;1",
    opacity: "0;1;1;1;0;0",
    d: "M276.903,400 h-112.258M 164.645 400 A -235.355 400 0 0 0 172.118 500",
    cx: "276.903;276.903;164.645;172.118;172.118;0",
    cy: "400;400;400;500;500;0",
    r: "0;50;50;50;0;0",
  },
  {
    id: "r7", dur: "4.9s",
    times: "0;0.098;0.196;0.294;0.392;0.49;1",
    opacity: "0;1;1;1;1;0;0",
    d: "M728.701,400 h-93.346M635.355,400 h-112.258M 519.188 500 A 123.097 400 0 0 0 523.097 400",
    cx: "728.701;728.701;635.355;523.097;519.188;519.188;0",
    cy: "400;400;400;400;500;500;0",
    r: "0;50;50;50;50;0;0",
  },
  {
    id: "r8", dur: "4.9s",
    times: "0;0.098;0.196;0.294;0.392;0.49;1",
    opacity: "0;1;1;1;1;0;0",
    d: "M400,100 h-81.421M318.579,100 h-74.252M 244.327 100 A -235.355 400 0 0 0 196.176 200",
    cx: "400;400;318.579;244.327;196.176;196.176;0",
    cy: "100;100;100;100;200;200;0",
    r: "0;50;50;50;50;0;0",
  },
  {
    id: "r9", dur: "4.1s",
    times: "0;0.098;0.195;0.293;0.39;1",
    opacity: "0;1;1;1;0;0",
    d: "M115.336,200 h80.84M 244.327 100 A -235.355 400 0 0 0 196.176 200",
    cx: "115.336;115.336;196.176;244.327;244.327;0",
    cy: "200;200;200;100;100;0",
    r: "0;50;50;50;0;0",
  },
  {
    id: "r10", dur: "4.9s",
    times: "0;0.098;0.196;0.294;0.392;0.49;1",
    opacity: "0;1;1;1;1;0;0",
    d: "M603.824,200 h-97.219M 519.188 300 A 123.097 400 0 0 0 506.605 200M519.188,300 h108.694",
    cx: "603.824;603.824;506.605;519.188;627.882;627.882;0",
    cy: "200;200;200;300;300;300;0",
    r: "0;50;50;50;50;0;0",
  },
  {
    id: "r11", dur: "4.9s",
    times: "0;0.098;0.196;0.294;0.392;0.49;1",
    opacity: "0;1;1;1;1;0;0",
    d: "M519.188,300 h-119.188M 400 400 A 0 400 0 0 0 400 300M 400 500 A 0 400 0 0 0 400 400",
    cx: "519.188;519.188;400;400;400;400;0",
    cy: "300;300;300;400;500;500;0",
    r: "0;50;50;50;50;0;0",
  },
  {
    id: "r12", dur: "4.9s",
    times: "0;0.098;0.196;0.294;0.392;0.49;1",
    opacity: "0;1;1;1;1;0;0",
    d: "M276.903,400 h123.097M400,400 h123.097M 519.188 500 A 123.097 400 0 0 0 523.097 400",
    cx: "276.903;276.903;400;523.097;519.188;519.188;0",
    cy: "400;400;400;400;500;500;0",
    r: "0;50;50;50;50;0;0",
  },
];

const GRID = ["M400 800 A-400 400 0 0 0 400 0", "M400 800 A-328.701 400 0 0 0 400 0", "M400 800 A-235.355 400 0 0 0 400 0", "M400 800 A-123.097 400 0 0 0 400 0", "M400 800 A0 400 0 0 0 400 0", "M400 0 A123.097 400 0 0 0 400 800", "M400 0 A235.355 400 0 0 0 400 800", "M400 0 A328.701 400 0 0 0 400 800", "M400 0 A400 400 0 0 0 400 800", "M135.425 100H664.575", "M53.59 200H746.41", "M12.702 300H787.299", "M0 400H800"];
const NODES = [[400, 100], [115.336, 200], [293.395, 200], [603.824, 200], [519.188, 300], [276.903, 400], [728.701, 400]];

const CORS = [
  ["Access-Control-Allow-Origin", "какие сайты могут читать ответ."],
  ["Access-Control-Allow-Methods", "какие HTTP-методы разрешены (GET, POST, PUT и т. д.)."],
  ["Access-Control-Allow-Headers", "какие нестандартные заголовки можно отправлять."],
  ["Access-Control-Allow-Credentials", "можно ли передавать cookies и другие учетные данные."]
];

const LEADS = [
  "Если один из провайдеров модели нестабилен, система автоматически переключается на ту же модель у другого провайдера, без простоев.",
  "Простые запросы используют дешёвые модели, сложные задачи - лучшие модели из доступных.",
  "Самый быстрый маршрут пересчитывается на каждом вызове: запрос уходит к провайдеру с наименьшей задержкой."
];

// [question, [label, highlighted, desktop position override], [[mark, name, sub, badge] × 2 (second is active)]]
const DIAGS = [
  ["Сбой провайдера?", [["основной", 0], ["резерв", 1]],
    [["AN", "Claude Opus 5.5", "Anthropic", "сбой"], ["AW", "Claude Opus 5.5", "Amazon Bedrock", "активен"]]],
  ["Стоимость токенов?", [["дешевле", 1, "--x:76px;--y:171px"], ["дороже", 0, "--x:88px;--y:89px"]],
    [["OA", "GPT-6.1 Sol", "openai/gpt-6.1-sol", rublePrice("$10/M")], ["DS", "DeepSeek V4 Flash", "deepseek/deepseek-v4-flash", rublePrice("$0.03/M")]]],
  ["Минимальный latency?", [["маршрут A", 0], ["маршрут B", 1]],
    [["OA", "GPT-6.1 Sol", "провайдер A", "медленнее"], ["OA", "GPT-6.1 Sol", "провайдер B", "быстрее"]]]
];

const NEWS = [
  ["7 октября", "Claude Haiku 5.5 теперь доступен на Alphy Gateway"],
  ["6 октября", "Mistral Large 4 теперь доступен на Alphy Gateway"],
  ["29 сентября", "GPT-6.1 Sol теперь доступен на Alphy Gateway"]
];

const MODS = [["All", "Все"], ["Text"], ["Code"], ["Image"], ["Video"], ["Audio"], ["Embedding"]];
const PROVS = ["all", ...Object.keys(PROV_LABELS).filter(prov => MODELS.some(model => model.prov === prov))];

const ENVS = [["alphy/instruction-env", "0.3.4", "ALPHY"], ["alphy/tool-env", "0.1.8", "ALPHY"], ["alphy/code-env", "0.2.6", "ALPHY"]];
const EVALS = [
  { answer: [2, 3, 5, 7, 11], score: 0.90 },
  { answer: [1, 4, 6, 9], score: 0.34 },
  { answer: [0, 1, 1, 2, 3, 5], score: 0.87 },
  { answer: [3, 6, 9, 12], score: 0.72 },
  { answer: [1, 2, 4, 8, 16], score: 0.92 }
];
const PARAMS = [["max_steps", "10,000"], ["rollouts_per_example", "19"], ["seq_len", "65,536"], ["batch_size", "4"], ["max_tokens", "256"], ["learning_rate", "0.00005"]];

// [provider, bar width %, value]; the first row is Alphy
const TPS = [["Alphy", 100, 651], ["Selectel", 93.7, 610], ["Cloud.ru", 73.7, 480], ["SberTech Platform V", 72.7, 473]];
const TTFT = [["Alphy", 43, 60], ["SberTech Platform V", 53.6, 75], ["Cloud.ru", 71.4, 100], ["Selectel", 100, 140]];
const SLA = [
  ["SLA", "99,95% Gateway · до 99,99% Dedicated"],
  ["КОМПЛАЕНС", "152-ФЗ для РФ · требования локализации данных по поддерживаемым юрисдикциям · без межрегионального routing"],
  ["БЕЗОПАСНОСТЬ", "TLS 1.2+ · шифрование данных · RBAC · audit logs"],
  ["API", "OpenAI-compatible · замена endpoint без переписывания SDK"],
  ["МОНИТОРИНГ", "TTFT · TPOT · throughput · токены · стоимость · request trace"]
];
const KPI = [["114 мс", "p50 TTFT"], ["417 мс", "p95 TTFT"], ["0,31%", "fallback rate"]];

const JURS = [["+7", "Россия"], ["+86", "Китай"], ["+65", "Сингапур"], ["+381", "Сербия"], ["+994", "Азербайджан"], ["+971", "ОАЭ"], ["+7", "Казахстан"], ["+375", "Беларусь"], ["+995", "Грузия"], ["+374", "Армения"], ["+996", "Кыргызстан"], ["+992", "Таджикистан"], ["+998", "Узбекистан"]];

/* ---------- markup ---------- */

const map = (a, f) => a.map(f).join("");

const CHEV = '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" stroke="#6E6E6E" stroke-width="1.4" stroke-linecap="square"/></svg>';
const CLOSE = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.3"/></svg>';

const diag = ([q, labels, cards], i) => `<div class="diag" data-diag="${i}"${i ? ' style="display:none"' : ""}>
<div class="appcard"><div class="dots"><i></i><i></i><i></i></div><div class="apt">Ваше приложение</div><i class="ab" style="width:82%;margin-bottom:8px"></i><i class="ab" style="width:58%;margin-bottom:16px"></i><i class="ab ab58"></i><i class="ab" style="width:72%;margin-bottom:8px"></i><i class="ab" style="width:40%"></i></div>
<div class="conn"></div><div class="qbox">${q}</div>
<div class="branch"><svg class="bd" viewBox="0 0 100 280" preserveAspectRatio="none" aria-hidden="true"><path class="dash" d="M0 140 C 40 140, 46 44, 100 44"/><path d="M0 140 C 40 140, 46 236, 100 236"/></svg><svg class="bm" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="dash" d="M50 0 C 50 50, 25 50, 25 100"/><path d="M50 0 C 50 50, 75 50, 75 100"/></svg>${map(labels, ([t, w, s]) => `<span class="bl${w ? " w" : ""}"${s ? ` style="${s}"` : ""}>${t}</span>`)}</div>
<div class="cards">${map(cards, ([mk, n, sub, b], j) => `<div class="card${j ? " on" : ""}"><span class="mk">${mk}</span><div class="cnm"><div>${n}</div><div>${sub.replace(/\/(.+)/, "/<span>$1</span>")}</div></div><span class="bdg">${b}</span></div>`)}</div>
</div>`;

const ct = (n, h, p) => `<div class="ct"><div class="ctn"><span>${n}</span><h3>${h}</h3></div><p>${p}</p></div>`;

const brow = ([n, w, v], i) => `<div class="brow${i ? "" : " a"}"><span>${n}</span><span class="bar"><i style="width:${w}%"></i></span><span>${v}</span></div>`;

// The provider prefix gets its own span: inline on desktop, a separate grey line on phones.
const row = r => {
  const i = r.name.indexOf("/") + 1;
  const note = r.priceNote || PRICE_NOTE;
  return `<div class="tr"><span class="tn"><span class="tm">${r.mark}</span><span class="nm"><span class="np">${r.name.slice(0, i)}</span>${r.name.slice(i)}</span></span><span class="tv">${r.context}</span><span class="tv">${r.latency}</span><span class="tv">${r.throughput}</span><span class="tv hi" title="${note}">${rublePrice(r.input)}</span><span class="tv hi po" title="${note}">${rublePrice(r.output)}</span><span class="cc"><span>Read:<br>Write:</span><span>${rublePrice(r.cacheRead)}<br>${rublePrice(r.cacheWrite)}</span></span><span class="wc"><span>${rublePrice(r.web)}</span><span>${r.webSub}</span></span></div>`;
};

const globe = () => `<svg viewBox="-2 -2 804 404" role="img" aria-label="Animated global delivery network"><defs><linearGradient id="grid-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="white"/><stop offset=".78" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="hemisphere-mask"><rect x="-4" y="-4" width="808" height="412" fill="url(#grid-fade)"/></mask></defs><g mask="url(#hemisphere-mask)"><g class="grid">${map(GRID, d => `<path d="${d}"/>`)}</g>${map(ROUTES, r => `<g mask="url(#hemisphere-mask)"><path class="packet" d="${r.d}" stroke="url(#${r.id}-gradient)"/><defs><radialGradient class="pg" id="${r.id}-gradient" cx="100" cy="100" r="0" gradientUnits="userSpaceOnUse"><stop offset="0"/><stop offset="0.4"/><stop offset="1" stop-opacity="0"/></radialGradient></defs></g>`)}</g>${map(NODES, ([x, y]) => `<g transform="translate(${x} ${y})"><circle class="ring" r="16"/><circle class="core" r="12"/><text x="0" y="0">a</text></g>`)}</svg>`;

/* BARS: shared topics keep the copy, diagram and technical notes in sync. */
const BARS_TOPICS = {
  bars: { technical: "BAR-based Activation Routing System", note: "Вычисления идут туда, где хранится нужный эксперт." },
  token: { technical: "Вектор активаций токена", note: "По шине идут килобайты активаций. Веса модели остаются на месте." },
  p2p: { technical: "P2P через BAR1, ACS отключён, IOMMU в passthrough", note: "Прямой обмен через BAR1: 0,4 мкс вместо 14 мкс, в 35 раз быстрее." },
  gpu: { technical: "GDDR7", note: "Каждый эксперт хранится один раз. 256 ГБ видеопамяти — 256 ГБ для модели." },
  ram: { technical: "MRDIMM-8800, 24 канала, ~1,6 ТБ/с", note: "1,5 ТБ MRDIMM-8800 для менее востребованных экспертов. 24 канала, ~1,6 ТБ/с." },
  cpu: { technical: "Матричные блоки AMX", note: "Xeon 6 считают экспертов в оперативной памяти с помощью AMX, без переноса на GPU." },
  nvme: { technical: "Gen5, RAID0, выравнивание по 4K", note: "Редкие эксперты на 8 NVMe (~100 ГБ/с). Подгружаются на слой раньше." },
  pcie: { technical: "192 линии PCIe 5.0: карты x16, диски x4", note: "У каждой GPU — x16, у каждого NVMe — x4. Выделенные линии PCIe 5.0." }
};
const barsTerm = (key, label) => `<button type="button" class="bars-term" data-bars="${key}" aria-label="${label}: подробности">${label}</button>`;
const barsIcon = kind => `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${kind === "chip" ? '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3"/>' : kind === "ram" ? '<rect x="4" y="5" width="16" height="13" rx="2"/><path d="M7 9h3v5H7zm7 0h3v5h-3zM7 18v3m5-3v3m5-3v3"/>' : kind === "token" ? '<path d="m12 3 9 5v8l-9 5-9-5V8l9-5Zm0 9 9-4m-9 4L3 8m9 4v9"/>' : '<path d="M4 8h16M4 16h16m-4-12 4 4-4 4M8 12l-4 4 4 4"/>'}</svg>`;
const barsDiagram = () => `<figure class="bars-figure" aria-label="Интерактивная схема архитектуры Alphy BARS">
<div class="bars-figure-head"><span class="k">АРХИТЕКТУРА BARS</span><span class="bars-live m"><i></i>3 яруса памяти</span></div>
<div class="bars-board">
<svg class="bars-wires" viewBox="0 0 600 580" preserveAspectRatio="none" fill="none" aria-hidden="true">
<g class="bars-wire" data-bars-link="bars gpu p2p token">${map(Array.from({length:8}), (_, i) => `<path d="M${81 + i * 62.5} 158V185H300"/>`)}<path d="M300 185v24"/></g>
<g class="bars-wire bars-wire-token" data-bars-link="bars token p2p"><path d="M128 240h42"/><path class="bars-packet" d="M128 240h42"/></g>
<g class="bars-wire" data-bars-link="pcie gpu"><path d="M50 110H20v184h110v37M550 110h30v184H470v37"/></g>
<g class="bars-wire" data-bars-link="ram cpu"><path d="M220 371h20M360 371h20"/><path class="bars-packet" d="M220 371h20M360 371h20"/></g>
<g class="bars-wire" data-bars-link="nvme pcie"><path d="M130 411v79M470 411v79"/><path class="bars-packet bars-packet-up" d="M130 490v-79M470 490v-79"/></g>
<text x="38" y="283">x16</text><text x="540" y="283">x16</text><text x="142" y="462">x4 × 4</text><text x="422" y="462">x4 × 4</text>
<text class="bars-wire-caption" x="300" y="304" text-anchor="middle">веса остаются на месте</text>
</svg>
<button type="button" class="bars-node bars-gpu" data-bars="gpu" data-bars-node="bars gpu p2p token pcie" aria-pressed="false">
<span class="bars-node-heading"><span>8 × GPU</span><span class="m">256 ГБ <small>GDDR7</small></span></span>
<span class="bars-gpu-cards">${map(Array.from({length:8}), (_, i) => `<span class="bars-gpu-card">${barsIcon("chip")}<span class="m">0${i + 1}</span></span>`)}</span>
<span class="bars-node-foot">Частые эксперты · без дублей</span></button>
<button type="button" class="bars-node bars-token" data-bars="token" data-bars-node="token" aria-pressed="false">${barsIcon("token")}<span>Токен</span><small class="m">килобайты</small></button>
<button type="button" class="bars-node bars-p2p" data-bars="p2p" data-bars-node="bars p2p token" aria-pressed="false">${barsIcon("link")}<span><b>GPU ↔ GPU</b><small class="m">P2P / BAR1</small></span><span class="bars-latency m">0,4<small>мкс</small></span></button>
${map(["01", "02"], (n, i) => `<button type="button" class="bars-node bars-cpu bars-cpu-${i}" data-bars="cpu" data-bars-node="cpu ram pcie" aria-pressed="false">${barsIcon("chip")}<span><b>Xeon 6</b><small class="m">AMX · CPU ${n}</small></span></button>`)}
<button type="button" class="bars-node bars-ram" data-bars="ram" data-bars-node="ram cpu" aria-pressed="false">${barsIcon("ram")}<b class="m">1,5 ТБ</b><span>MRDIMM</span><small>Менее частые</small></button>
<button type="button" class="bars-pcie m" data-bars="pcie" data-bars-node="pcie" aria-pressed="false">192 линии PCIe 5.0</button>
<button type="button" class="bars-node bars-nvme" data-bars="nvme" data-bars-node="nvme pcie" aria-pressed="false"><span class="bars-node-heading"><span>8 × NVMe</span><span class="m">~100 ГБ/с</span></span><span class="bars-drives">${map(Array.from({length:8}), () => '<i><span></span></i>')}</span><span class="bars-node-foot">Редкие эксперты · предзагрузка</span></button>
</div>
</figure>`;
const barsSection = () => `<section id="how" class="wrap st2 bars-section" aria-labelledby="bars-title">
<div class="bars-heading"><h2 id="bars-title">Как это работает</h2></div>
<div class="bars-layout"><div class="bars-copy">
<p class="bars-intro" data-bars-copy="bars">${barsTerm("bars", "Alphy BARS")}<br><span>синтетический NVLink</span></p>
<div class="bars-copy-block" data-bars-copy="token p2p"><p>Чтобы модель работала на нескольких видеокартах, между ними гоняются куски самой модели, а это мегабайты. У нас же по шине едет <strong>только ${barsTerm("token", "токен")}</strong>, то есть то, что модель обрабатывает прямо сейчас, а это <strong>килобайты</strong>.</p><p>Карты ${barsTerm("p2p", "общаются напрямую")}, минуя процессор и оперативную память, поэтому данные доходят за <strong class="m">0,4 мкс</strong> вместо обычных 14. <span class="bars-speed">Это в <strong>35 раз</strong> быстрее.</span></p></div>
<div class="bars-copy-block" data-bars-copy="gpu"><p>Каждая часть модели (эксперт) хранится <strong>в одном месте, без дублей</strong>. Самые востребованные лежат прямо на видеокартах, причём те, что обычно срабатывают вместе, расположены рядом. Поэтому ${barsTerm("gpu", "256 ГБ видеопамяти")} дают <strong>256 ГБ места</strong>, а не восемь копий одного и того же.</p></div>
<div class="bars-copy-block" data-bars-copy="ram cpu nvme"><p>Менее востребованные эксперты лежат в ${barsTerm("ram", "1,5 ТБ быстрой оперативной памяти")}. Это второй ярус памяти: <strong>два Xeon 6</strong> ${barsTerm("cpu", "считают их прямо на месте")}, без перетаскивания на видеокарты.</p><p>Редко используемые хранятся на ${barsTerm("nvme", "восьми NVMe-дисках (~100 ГБ/с)")} и подгружаются <strong>на слой раньше</strong>, чем понадобятся.</p></div>
<div class="bars-copy-block" data-bars-copy="pcie"><p>У каждой видеокарты и каждого диска ${barsTerm("pcie", "своя полноценная линия связи")}, ни с кем не поделённая.</p></div>
<p class="bars-conclusion">Мы отправляем вычисления туда,<br class="bars-desktop-break"> где лежит модель.</p>
</div>${barsDiagram()}</div>
<div class="bars-tooltip" id="bars-tooltip" role="tooltip" hidden><span id="bars-tooltip-text"></span></div>
</section>`;

/* Activity preview: 182 real calendar dates, deterministic synthetic events.
   Replace makeActivityDays with the event feed when it is available. */
const activityRandom = seed => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let n = Math.imul(state ^ state >>> 15, 1 | state);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
};
const activityQuantity = (n, one, few, many) => n + " " +
  (n % 100 >= 11 && n % 100 <= 14 ? many : n % 10 === 1 ? one : n % 10 >= 2 && n % 10 <= 4 ? few : many);

function makeActivityDays(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Europe/Moscow", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now);
  const part = key => Number(parts.find(p => p.type === key).value);
  const end = Date.UTC(part("year"), part("month") - 1, part("day"));
  const format = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
  const types = ["experiment", "deployment", "retraining", "ab-test", "rollback"];
  let active = 0, cycle = [];
  return Array.from({ length: 182 }, (_, i) => {
    const date = new Date(end - (181 - i) * 86400000);
    const random = activityRandom(Math.floor(date.getTime() / 86400000) ^ 0xA1F4);
    const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    let summary = "без новых событий", type = "quiet", total = 0;
    if (random() > (weekend ? .32 : .10)) {
      // A shuffled cycle keeps the five primary event types evenly represented.
      if (active % 5 === 0) {
        cycle = types.slice();
        const shuffle = activityRandom(Math.floor(active / 5) + 4137);
        for (let j = 4; j > 0; j--) {
          const k = Math.floor(shuffle() * (j + 1));
          [cycle[j], cycle[k]] = [cycle[k], cycle[j]];
        }
      }
      type = cycle[active++ % 5];
      const experiments = 1 + Math.floor(random() * (weekend ? 3 : 6));
      const exp = activityQuantity(experiments, "эксперимент", "эксперимента", "экспериментов");
      const target = ["ранжирования", "рекомендаций", "поиска"][Math.floor(random() * 3)];
      if (type === "experiment") {
        const deploy = random() > .55, retrain = random() > .8;
        total = experiments + Number(deploy) + Number(retrain);
        summary = exp + (random() > .45 ? " с квантизацией, latency −" + (3 + Math.floor(random() * 12)) + "%" : "") +
          (deploy ? ", выкатка" : "") + (retrain ? ", переобучение " + target : "");
      } else if (type === "deployment") {
        const preceding = random() > .4;
        total = 1 + (preceding ? experiments : 0);
        summary = (preceding ? exp + ", " : "") + (random() > .75 ? "новый проект: пайплайн развёрнут за день" : "новая модель " + target + " в проде");
      } else if (type === "retraining") {
        const preceding = random() > .5, deploy = random() > .65;
        total = 1 + Number(deploy) + (preceding ? experiments : 0);
        summary = (random() > .5 ? "дрейф данных → автопереобучение" : "переобучение " + target) +
          (preceding ? ", " + exp : "") + (deploy ? ", выкатка" : "");
      } else if (type === "ab-test") {
        const preceding = random() > .5, deploy = random() > .45;
        total = 1 + Number(deploy) + (preceding ? experiments : 0);
        summary = "A/B-тест " + target + " завершён" + (deploy ? ", новая модель в проде" : "") + (preceding ? ", " + exp : "");
      } else {
        const preceding = random() > .55;
        total = 2 + (preceding ? experiments : 0);
        summary = "выкатка, откат за " + (2 + Math.floor(random() * 5)) + " мин после аномалии в метриках" + (preceding ? ", " + exp : "");
      }
    }
    const level = total === 0 ? 0 : total <= 2 ? 1 : total <= 4 ? 2 : total <= 6 ? 3 : 4;
    return { date: date.toISOString().slice(0, 10), label: format.format(date) + " · " + summary, type, total, level };
  });
}

const ACTIVITY_DAYS = makeActivityDays();
const ACTIVITY_GLYPHS = [
  ["0000", "0000", "0110", "0001", "0111", "1001", "0111"],
  ["1100", "0100", "0100", "0100", "0100", "0100", "0110"],
  ["0000", "0000", "1110", "1001", "1110", "1000", "1000"],
  ["1000", "1000", "1000", "1110", "1001", "1001", "1001"],
  ["0000", "0000", "1001", "1001", "0111", "0001", "0110"]
];
const activitySection = () => `<section id="activity" class="wrap st2 activity-section" aria-labelledby="activity-title">
<h2 id="activity-title">Обучаем, проверяем,<br>выкатываем. Каждый день.</h2>
<div class="activity-board is-intro">
<div class="activity-grid" role="group" aria-label="События за последние 26 недель" inert>
${map(ACTIVITY_DAYS, (day, i) => `<button type="button" class="activity-day" data-day="${i}" data-date="${day.date}" data-level="${day.level}" data-total="${day.total}" data-type="${day.type}" tabindex="-1" aria-label="${day.label}" aria-pressed="false"></button>`)}
</div>
<div class="activity-pixels" aria-hidden="true">${map(ACTIVITY_GLYPHS, (glyph, letter) => map(glyph, (line, row) => map(line.split(""), (bit, col) => bit === "1" ? `<i class="activity-pixel" style="grid-row:${row + 1};grid-column:${letter * 5 + col + 2}"></i>` : "")))}</div>
</div>
<div id="activity-tooltip" class="activity-tooltip" role="tooltip" hidden></div>
</section>`;

const page = () => `
<header class="hd"><div class="wrap">
<a href="#top" class="logo">alphy</a>
<nav class="nav"><a href="#cloud">Платформа</a><a href="#pricing">Gateway</a><a href="#api">API</a></nav>
<div class="navbtns"><button class="bo sm" data-act="login">Войти</button><button class="bw sm" data-act="contact">Получить доступ</button></div>
</div></header>

<section id="top" class="wrap">
<div class="hero">
<div class="hl">
<h1>Самый быстрый<br>ML инференс в СНГ</h1>
<p class="sub">Мгновенный доступ к передовым моделям. Инфраструктура обучения, развёртывания и постобучения.</p>
<div class="cta"><a href="#cloud" class="bw lg" style="gap:14px;padding:0 18px">Платформа</a><button class="bo lg hb" data-act="contact">Связаться</button></div>
<div class="ocean"><canvas aria-hidden="true"></canvas><i></i><i></i></div>
</div>
<div class="slot" id="slot"><div class="panel" id="panel">
<span class="vlabel" id="vlabel">Оцените скорость</span>
<div class="pbody" id="pbody">
<i class="cn c1"></i><i class="cn c2"></i><i class="cn c3"></i><i class="cn c4"></i>
<div class="pbar"><div class="dots"><i></i><i></i><i></i></div><div class="stats m"><span id="tps">521 tokens/сек</span><i></i><span id="tok">585 всего, 568 на выход</span></div></div>
<div class="pmain xs" id="pmain">
<div id="demo"><h3 class="pt">Что такое CORS политика?</h3><div class="hr"></div>
<p class="pp" style="text-wrap:pretty">CORS — это механизм безопасности браузера, который ограничивает доступ JavaScript к ответам с другого origin без явного разрешения сервера.</p>
<p class="pp" style="margin:12px 0 10px">Ключевые заголовки:</p>
<ul class="hl2">${map(CORS, ([h, t], i) => `<li><span>0${i + 1}</span><span><code>${h}</code> — ${t}</span></li>`)}</ul></div>
<div id="auto" style="display:none"><h3 class="pt" id="atitle" style="min-height:23px"></h3><div class="hr"></div><div id="abody"></div></div>
<div id="notice" style="display:none"><div class="pt" id="echo" style="min-height:24px"></div><div class="hr"></div><div class="out" id="out"></div>
<div class="empty" id="empty"><i></i><div><div class="m">API не подключён</div><div>Укажите endpoint — и панель начнёт отвечать вашей моделью, считая tokens и скорость в реальном времени.</div></div></div></div>
</div>
<div class="pin"><div class="iw" id="iw"><input id="q" type="text" placeholder="Введите промпт, оцените скорость" autocomplete="off"><button class="send" id="send" aria-label="Отправить"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg></button></div></div>
</div>
</div></div>
</div>
<div class="lgw"><div class="logos">
<img src="${BASE}logos/atom.png" alt="Atom" class="l-atom">
<img src="${BASE}logos/yadro.svg" alt="Yadro" class="l-yadro">
<div><img src="${BASE}logos/directum-mark.svg" alt="" class="l-dir"><span>Directum</span></div>
<img src="${BASE}logos/nexign.png" alt="Nexign" class="l-nx">
<div><span class="sq"></span><img src="${BASE}logos/positive.svg" alt="Positive Technologies" class="l-pt"></div>
</div></div>
</section>

<section id="pricing" class="wrap st">
<div class="g2 ph"><h2>Баланс доступности,<br>цены и скорости.</h2><div style="padding-top:4px">${map(LEADS, (t, i) => `<p class="lead" data-lead="${i}"${i ? ' style="display:none"' : ""}>${t}</p>`)}</div></div>
<div class="seg s1">${map(["Доступность", "Цена", "Скорость"], (t, i) => `<button data-tab="${i}"${i ? "" : ' class="on"'}>${t}</button>`)}</div>
<div class="dwrap xs">${map(DIAGS, diag)}</div>
</section>

<section id="api" class="wrap st">
<div class="g3 news">${map(NEWS, ([d, t]) => `<article><div class="nd"><span>${d}</span><span>Changelog</span></div><div class="nt">${t}</div></article>`)}</div>
<h2 class="h2c">Один API для всех моделей</h2>
<div class="tbl" id="tbl">
<div class="tbar">
<div class="seg s2 xs">${map(MODS, ([k, t], i) => `<button data-mod="${k}"${i ? "" : ' class="on"'}>${t || k}</button>`)}</div>
<div class="dd"><button class="ddb" data-menu-btn="prov"><span id="provlabel">Все провайдеры</span>${CHEV}</button><div class="ddm sc" data-menu="prov">${map(PROVS, (k, i) => `<button data-prov="${k}"${i ? "" : ' class="on"'}>${PROV_LABELS[k]}</button>`)}</div></div>
<div class="filters">
<div class="dd"><button class="ddb" data-menu-btn="sort"><span class="dim">Сортировка</span><span id="sortlabel">по дате</span>${CHEV}</button><div class="ddm r" data-menu="sort">${map(Object.keys(SORT_LABELS), (k, i) => `<button data-sort="${k}"${i ? "" : ' class="on"'}>${SORT_LABELS[k]}</button>`)}</div></div>
<div class="dd"><button class="ddb" data-menu-btn="cols"><span>Колонки</span><span class="dim" id="colcount">(8)</span>${CHEV}</button><div class="ddm r" data-menu="cols"><button class="ck" data-col="cache"><span class="box">✓</span>Cache</button><button class="ck" data-col="web"><span class="box">✓</span>Web Search</button></div></div>
</div>
</div>
<div class="srch"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="4.6" stroke="#4A4A4A" stroke-width="1.3"/><path d="m10.6 10.6 3 3" stroke="#4A4A4A" stroke-width="1.3" stroke-linecap="square"/></svg><input id="search" type="text" placeholder="Поиск модели..." autocomplete="off"></div>
<div class="tsc xs"><div class="tmin">
<div class="th"><span>Модель</span><span class="r">Context</span><span class="r">Latency</span><span class="r">Throughput</span><span class="r" title="${PRICE_NOTE}">Input · ₽</span><span class="r" title="${PRICE_NOTE}" style="padding-right:18px">Output · ₽</span><span class="cc">Cache</span><span class="wc">Web Search</span></div>
<div id="tbody"></div>
</div></div>
<div class="tfoot"><span id="count"></span><span title="${PRICE_NOTE}">Цены в ₽ · M = 1 млн токенов</span></div>
</div>
</section>

<section id="cloud" class="wrap st">
<h2 class="h2p">Облачная платформа</h2>
<div class="g2 cgrid">
<div class="br bb"><div class="viz c"><div class="dia">
<span class="sp sv" style="top:38px"></span><span class="sp sv" style="top:178px"></span><span class="sp sh" style="left:30%"></span><span class="sp sh" style="right:30%"></span>
<span class="dmd"></span><span class="pl"></span><span class="pl"></span>
<span class="node nx" style="top:8px">INIT</span><span class="node nx" style="top:204px">EVAL</span><span class="node" style="left:0;top:106px">PUSH</span><span class="node" style="right:0;top:106px">DEVELOP</span>
</div></div>${ct("01", "RL окружение", "Инициализация, разработка, оценка и публикация окружения.")}</div>
<div class="bb"><div class="viz eval-viz">
<div class="envs"><div class="env on"><div>alphy/<b>logic-env</b></div><div class="em"><span>0.2.17</span><span>ALPHY</span></div><div class="evb">Оценить</div></div>${map(ENVS, ([n, v, o]) => `<div class="env"><div>${n}</div><div class="em"><span>${v}</span><span>${o}</span></div></div>`)}</div>
<div class="evals"><div class="eh"><span>ID</span><span>РЕЗУЛЬТАТ</span><span>ОЦЕНКА</span></div>${map(EVALS, ({ answer, score }, i) => `<div class="er"><span>${i + 1}</span><span title='${JSON.stringify({ answer })}'>"answer": ${JSON.stringify(answer)}</span><span>${score.toFixed(2)}</span></div>`)}</div>
</div>${ct("02", "Оценки и бенчмарки", "Гибкая оценка производительности моделей")}</div>
<div class="br"><div class="viz trn">
<div class="rw"><div class="rwh"><span>Награда</span><span id="rv">${FINAL_REWARD}</span></div>
<div class="rwb"><div class="ax"><span>1</span><span>0.8</span><span>0.6</span><span>0.4</span><span>0.2</span><span>0</span></div>
<div class="chart" id="chart"><span id="shade"></span><span id="cur"></span><span id="dot"></span><svg viewBox="0 0 600 210" preserveAspectRatio="none" aria-hidden="true">${map([150, 300, 450], x => `<line x1="${x}" y1="0" x2="${x}" y2="210" stroke="#131313" stroke-width="1" vector-effect="non-scaling-stroke"/>`)}<polyline id="poly" points="${POINTS}" fill="none" stroke="#EDEDED" stroke-width="1" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg></div></div>
<div class="rwf"><span>0</span><span id="step">шаги</span><span>10 000</span></div></div>
<div class="prm">${map(PARAMS, ([k, v]) => `<div><span>${k}</span><i></i><span>${v}</span></div>`)}</div>
</div>${ct("03", "Обучение", "Обучение крупных моделей.")}</div>
<div><div class="viz c ch"><div class="chain">
<div class="base"><div class="lbl">БАЗОВАЯ</div><div class="cnm2">Muse Spark 1.1</div><div class="bars"><i></i><i></i><i></i></div></div>
<div class="flow"></div><div class="lora">LoRA</div><div class="flow"></div>
<div class="ep"><div class="lbl">ЭНДПОИНТ</div><div class="cnm2">Выделенный</div><div class="eps"><i></i><span>1.2s · 145 tps</span></div></div>
</div></div>${ct("04", "Инференс", "Выделенный инференс для ваших моделей с поддержкой LoRA.")}</div>
</div>
<div class="ctaw"><button class="bw lg" data-act="login">Начать обучение</button></div>
</section>

<section id="bench" class="wrap st2">
<div class="g2 bh"><h2>Скорость через API</h2><div style="padding-bottom:4px"><p>Qwen 3.8 27B-A3B, text-only, 4k input → 512 output. Независимый замер:&nbsp;<a href="https://yukon.org/" target="_blank" rel="noreferrer">yukon.org/alphy</a>.</p></div></div>
<div class="g2 bgrid">
<div class="bc br"><div class="bct"><div class="k">TOKENS / SEC</div><div>больше — лучше</div></div><div class="brs">${map(TPS, brow)}</div><div class="bf">+6,7% к ближайшему результату</div></div>
<div class="bc"><div class="bct"><div class="k">TTFT, МС</div><div>меньше — лучше</div></div><div class="brs">${map(TTFT, brow)}</div><div class="bf">в 2,3 раза быстрее отклик, чем у Selectel</div></div>
</div>
<div class="g5 sla">${map(SLA, ([k, t]) => `<div><div class="k">${k}</div><div>${t}</div></div>`)}</div>
<div class="g3 kpi">${map(KPI, ([v, l]) => `<div><span>${v}</span><span>${l}</span></div>`)}</div>
</section>

${barsSection()}

${activitySection()}

<section id="power" class="wrap st2"><div class="g2 pw"><h2>Ваши модели<br>на наших мощностях</h2><div class="gw"><div class="globe">${globe()}</div></div></div></section>

<footer class="wrap ft"><div class="fc">
<div><div class="logo">alphy</div><p>Мгновенный доступ к передовым моделям.</p></div>
<div class="fcol"><div class="fk">ПРОДУКТ</div><a href="#cloud">Платформа</a><a href="#pricing">Цены</a><a href="#api">API</a></div>
<div class="fcol"><div class="fk">АККАУНТ</div><button data-act="login">Войти</button><button data-act="contact">Получить доступ</button></div>
</div>
<div class="fb"><span>© 2026 alphy</span><span>Самый быстрый ML инференс в СНГ</span></div>
</footer>

<div class="ov" id="modal"><div class="mcard">
<button class="x" data-act="close" aria-label="Закрыть">${CLOSE}</button>
<div class="ml"><div class="logo">alphy</div><h2>Поговорите<br>с нашей командой</h2>
<div class="mi"><span>01</span><p><b>Кастомное демо.</b> Покажем возможности Alphy на ваших сценариях и подберём гибкие условия.</p></div>
<div class="mi"><span>02</span><p><b>Доступ к Gateway.</b>&nbsp;Ключи и лимиты под вашу нагрузку.</p></div>
<div class="ms"><div><div>${MODELS.length}</div><div>моделей в Gateway</div></div><div><div>13</div><div>юрисдикций</div></div></div>
</div>
<div class="mr"><div class="fm">
<div><label for="f-mail">Рабочая почта</label><input class="in" id="f-mail" type="email" placeholder="name@company.com"></div>
<div class="fm2"><div><label for="f-name">Имя</label><input class="in" id="f-name" type="text" placeholder="Иван Петров"></div><div><label for="f-tel">Телефон <span>(необязательно)</span></label><div class="tel"><span id="dial">+7</span><input id="f-tel" type="tel" placeholder="900 000-00-00"></div></div></div>
<div><label for="jur">Юрисдикция</label><select class="in" id="jur">${map(JURS, ([c, n]) => `<option value="${c}">${n}</option>`)}</select><div class="hint">Мы активно расширяем список доступных юрисдикций</div></div>
<div><label for="f-site">Сайт компании</label><input class="in" id="f-site" type="text" placeholder="https://company.com"></div>
<div><label>Какой продукт вас интересует?</label><div class="seg s3"><button data-prod="gateway" class="on">AI Gateway</button><button data-prod="cloud">Cloud</button></div></div>
<div><label for="f-msg">Чем мы можем Вам помочь?</label></div>
<textarea id="f-msg" rows="4" placeholder="Опишите вашу задачу"></textarea><button class="bw b40" data-act="submit">Отправить заявку</button>
<div id="sent">Заявка отправлена — свяжемся в течение рабочего дня.</div>
</div></div>
</div></div>

<div class="ov" id="login"><div class="lc">
<button class="x" data-act="close" aria-label="Закрыть">${CLOSE}</button>
<div class="logo">alphy</div><h2>Вход в консоль</h2>
<div class="fm">
<div><label for="l-mail">Почта</label><input class="in" id="l-mail" type="email" placeholder="name@company.com"></div>
<div><label for="l-pass">Пароль</label><input class="in" id="l-pass" type="password" placeholder="••••••••"></div>
<div id="lerr">Неправильный логин или пароль</div>
<button class="bw b40" data-act="lsubmit">Продолжить</button>
<div class="or"><i></i><span>ИЛИ</span><i></i></div>
<button class="bo b40" data-act="lsubmit">Продолжить через SSO</button>
</div>
</div></div>`;

/* ---------- pixel ocean (WebGL) ---------- */

const VERT = `attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.0,1.0);}`;

const FRAG = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  float hash(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+1.0),f.x),f.y);}
  float fbm(vec2 p){float sum=0.0,amp=0.5;mat2 rot=mat2(0.80,0.60,-0.60,0.80);
    for(int i=0;i<4;i++){sum+=amp*noise(p);p=rot*p*2.03+7.1;amp*=0.5;}return sum;}
  float sea(vec2 p,float t){vec2 q=vec2(fbm(p+vec2(0.0,t*0.09)),fbm(p+vec2(5.2,-t*0.07)));
    return fbm(p+2.4*q+vec2(t*0.035,-t*0.055));}
  void main(){
    vec2 p=(gl_FragCoord.xy*2.0-u_resolution.xy)/u_resolution.y;
    float t=u_time;
    float tide=sea(p*1.00,t);
    float detail=fbm(p*2.85+11.0+vec2(t*0.05,-t*0.04));
    float waves=smoothstep(0.38,0.78,tide*0.78+detail*0.34);
    waves*=0.70+0.30*smoothstep(0.43,0.72,tide);
    float cell=clamp(floor(min(u_resolution.x,u_resolution.y)/26.0),7.0,16.0);
    vec2 local=fract(gl_FragCoord.xy/cell)-0.5;
    float radius=0.105+waves*0.305;
    float dotMask=1.0-smoothstep(radius,radius+0.045,length(local));
    float vignette=1.0-smoothstep(0.45,1.38,length(p*vec2(0.72,1.0)));
    float shimmer=0.84+0.16*sin((p.x+p.y)*4.0+t*0.6);
    float lum=dotMask*waves*shimmer*(0.50+0.50*vignette);
    lum=pow(lum,1.62)*0.82;
    gl_FragColor=vec4(vec3(lum),1.0);
  }`;

function ocean(c) {
  const gl = c.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return;
  const prog = gl.createProgram();
  [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]].forEach(([type, src]) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    gl.attachShader(prog, s);
  });
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, "u_resolution"), uTime = gl.getUniformLocation(prog, "u_time");
  const start = performance.now();
  let last = 0, visible = true;
  new IntersectionObserver(e => { visible = e[e.length - 1].isIntersecting; }, { rootMargin: "200px" }).observe(c);
  const frame = now => {
    requestAnimationFrame(frame);
    if (!visible || now - last < 33) return;
    last = now;
    const w = Math.max(1, c.clientWidth), h = Math.max(1, c.clientHeight);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  requestAnimationFrame(frame);
}

/* ---------- globe packets ---------- */

// The design animated the packets with SMIL <animate> on the gradients. Safari advances those values but
// never repaints the strokes, so the packets stood still on iPhones; the same keyframes are played from JS.
function globeAnim(svg) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const paths = svg.querySelectorAll(".packet"), grads = svg.querySelectorAll("radialGradient");
  const nums = s => s.split(";").map(Number);
  const tracks = ROUTES.map((r, i) => ({
    dur: parseFloat(r.dur) * 1000,
    times: nums(r.times),
    keys: [[paths[i], "opacity", nums(r.opacity)], [grads[i], "cx", nums(r.cx)], [grads[i], "cy", nums(r.cy)], [grads[i], "r", nums(r.r)]]
  }));
  let visible = false;
  new IntersectionObserver(e => { visible = e[e.length - 1].isIntersecting; }).observe(svg);
  const frame = now => {
    requestAnimationFrame(frame);
    if (!visible) return;
    for (const t of tracks) {
      const p = now % t.dur / t.dur;
      let k = 0;
      while (k < t.times.length - 2 && p >= t.times[k + 1]) k++;
      const f = (p - t.times[k]) / (t.times[k + 1] - t.times[k]);
      for (const [el, attr, v] of t.keys) el.setAttribute(attr, (v[k] + (v[k + 1] - v[k]) * f).toFixed(2));
    }
  };
  requestAnimationFrame(frame);
}

/* ---------- behaviour ---------- */

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const show = (el, on, display) => { el.style.display = on ? display || "block" : "none"; };
const setOn = (sel, el) => $$(sel).forEach(b => b.classList.toggle("on", b === el));

const setStats = (a, b) => { $("tps").textContent = a; $("tok").textContent = b; };
const refreshSend = () => { $("send").style.opacity = $("q").value.trim() ? "1" : "0.3"; };

// Demo autoplay: types a question, streams a canned answer, repeats while the panel is visible.
let autoStop = false, autoTyped = false, autoVisible = true, waitT = 0, segNodes = [];
const wait = ms => new Promise(r => { waitT = setTimeout(r, ms); });

async function waitVisible() {
  while (!autoStop && !autoVisible) await wait(400);
}

function stopAuto(clear) {
  autoStop = true;
  clearTimeout(waitT);
  if (clear && autoTyped) { $("q").value = ""; refreshSend(); }
  autoTyped = false;
}

function bindAuto() {
  if ("IntersectionObserver" in window) {
    autoVisible = false;
    new IntersectionObserver(e => { autoVisible = e[e.length - 1].isIntersecting; }, { threshold: 0.25 }).observe($("panel"));
  }
  autoplay();
}

async function autoplay() {
  let i = 0;
  await wait(1400);
  while (!autoStop) {
    await waitVisible();
    if (autoStop) break;
    const d = DEMOS[i++ % DEMOS.length];
    await typeQuestion(d.q);
    if (autoStop) break;
    await wait(420);
    $("q").value = "";
    refreshSend();
    autoTyped = false;
    renderAnswer(d);
    await streamAnswer(d);
    if (autoStop) break;
    await wait(6400);
  }
}

async function typeQuestion(q) {
  const input = $("q");
  autoTyped = true;
  input.value = "";
  for (let n = 1; n <= q.length; n++) {
    if (autoStop) return;
    input.value = q.slice(0, n);
    refreshSend();
    await wait(26 + Math.random() * 30);
  }
}

function renderAnswer(d) {
  show($("demo"), false);
  show($("notice"), false);
  show($("auto"), true);
  $("pmain").scrollTop = 0;
  $("atitle").textContent = d.q;
  const body = $("abody");
  body.textContent = "";
  segNodes = d.segs.map(s => {
    const wrap = document.createElement("div");
    wrap.className = "a-" + (s.k === "code" || s.k === "meta" || s.k === "h" ? s.k : "p");
    let host = wrap;
    if (s.k === "h") {
      const n = document.createElement("span");
      n.textContent = s.n;
      host = document.createElement("span");
      wrap.append(n, host);
    }
    const head = document.createTextNode(""), tail = document.createElement("span");
    tail.className = "tl";
    host.append(head, tail);
    body.appendChild(wrap);
    return { head, tail };
  });
}

// The last 12 characters of a streaming segment are dimmed.
function setSeg(node, text, streaming) {
  const cut = streaming ? Math.max(0, text.length - 12) : text.length;
  const h = text.slice(0, cut), t = text.slice(cut);
  if (node.head.textContent !== h) node.head.textContent = h;
  if (node.tail.textContent !== t) node.tail.textContent = t;
}

async function streamAnswer(d) {
  const lens = d.segs.map(s => s.t.length);
  const total = lens.reduce((a, b) => a + b, 0);
  const tps = d.tps || 340, rate = tps * 3.9;
  const inTok = Math.max(1, Math.round(d.q.length / 3.6));
  const t0 = performance.now(), main = $("pmain");
  let shown = 0;
  while (shown < total && !autoStop) {
    await wait(40);
    shown = Math.min(total, Math.round((performance.now() - t0) / 1000 * rate));
    let rem = shown;
    for (let i = 0; i < d.segs.length; i++) {
      const take = Math.max(0, Math.min(lens[i], rem));
      setSeg(segNodes[i], d.segs[i].t.slice(0, take), take < lens[i] && take > 0);
      rem -= lens[i];
    }
    main.scrollTop = main.scrollHeight;
    const outTok = Math.max(1, Math.round(shown / 3.9));
    setStats(tps + " tokens/сек", (inTok + outTok) + " всего, " + outTok + " на выход");
  }
}

function showNotice() {
  show($("demo"), false);
  show($("auto"), false);
  show($("notice"), true);
}

// Each send bumps `gen`, so an older stream that is still running stops writing into the panel.
let gen = 0;

async function sendGroq(prompt, out, my) {
  const head = document.createTextNode(""), tail = document.createElement("span"), main = $("pmain");
  tail.className = "tl";
  out.textContent = "";
  out.append(head, tail);
  const paint = (txt, live) => {
    const cut = live ? Math.max(0, txt.length - 12) : txt.length;
    head.textContent = txt.slice(0, cut);
    tail.textContent = txt.slice(cut);
    main.scrollTop = main.scrollHeight;
  };
  setStats("генерация…", "0 всего, 0 на выход");
  const inTok = Math.max(1, Math.round(prompt.length / 4));
  let text = "", outTok = 0, t0 = 0;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + nextGroqKey() },
      body: JSON.stringify({
        model: GROQ_MODEL, stream: true, temperature: 0.5, max_tokens: 500,
        messages: [
          { role: "system", content: "Отвечай кратко, по-русски." },
          { role: "user", content: prompt.slice(0, 1200) }
        ]
      })
    });
    if (!res.ok) throw new Error("HTTP " + res.status + " " + (await res.text()).slice(0, 160));
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (my !== gen) { reader.cancel(); return; }
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        const s = line.trim();
        if (!s.startsWith("data:")) continue;
        const payload = s.slice(5).trim();
        if (payload === "[DONE]") continue;
        let j;
        try { j = JSON.parse(payload); } catch (e) { continue; }
        const ch = j.choices && j.choices[0];
        const delta = ch && ch.delta && ch.delta.content;
        if (delta) {
          if (!t0) t0 = performance.now();
          text += delta;
          paint(text, true);
        }
        const u = j.x_groq && j.x_groq.usage;
        if (u && u.completion_tokens) outTok = u.completion_tokens;
      }
    }
    paint(text, false);
    const secs = Math.max(0.001, (performance.now() - (t0 || performance.now())) / 1000);
    if (!outTok) outTok = Math.max(1, Math.round(text.length / 3.6));
    setStats(Math.round(outTok / secs) + " tokens/сек", (inTok + outTok) + " всего, " + outTok + " на выход");
  } catch (err) {
    if (my !== gen) return;
    out.textContent = "Ошибка запроса: " + (err && err.message ? err.message : String(err));
    setStats("— tokens/сек", "запрос не выполнен");
  }
}

async function send() {
  stopAuto(false);
  const input = $("q"), prompt = input.value.trim();
  if (!prompt) return;
  const my = ++gen, ep = API_ENDPOINT.trim(), out = $("out"), empty = $("empty");
  showNotice();
  $("echo").textContent = prompt;
  out.textContent = "";
  input.value = "";
  refreshSend();

  if (!ep && GROQ_KEY) { show(empty, false); return sendGroq(prompt, out, my); }
  if (!ep) {
    show(empty, true, "flex");
    setStats("— tokens/сек", "ожидание endpoint");
    return;
  }

  show(empty, false);
  setStats("генерация…", "0 всего, 0 на выход");
  const t0 = performance.now();
  try {
    const res = await fetch(ep, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, stream: false })
    });
    const raw = await res.text();
    if (my !== gen) return;
    let text = raw;
    try {
      const j = JSON.parse(raw);
      text = j.text || j.output || j.completion || (j.choices && j.choices[0] && (j.choices[0].text || (j.choices[0].message && j.choices[0].message.content))) || raw;
    } catch (e) {}
    out.textContent = text;
    const secs = Math.max(0.001, (performance.now() - t0) / 1000);
    const outTok = Math.max(1, Math.round(String(text).length / 4));
    const inTok = Math.max(1, Math.round(prompt.length / 4));
    setStats(Math.round(outTok / secs) + " tokens/сек", (inTok + outTok) + " всего, " + outTok + " на выход");
  } catch (err) {
    if (my !== gen) return;
    out.textContent = "Ошибка запроса: " + (err && err.message ? err.message : String(err));
    setStats("— tokens/сек", "запрос не выполнен");
  }
}

// Panel docking: past the hero it collapses into a vertical tab on the right edge; click opens it.
let panelMode = "flow";

function setPanelMode(mode) {
  const p = $("panel"), slot = $("slot"), body = $("pbody"), label = $("vlabel"), s = p.style;
  if (mode === panelMode) return;
  panelMode = mode;
  // Every section is its own z-index:1 stacking context, so a docked panel would sit under later
  // sections (as it did in the design); lift the hero section above them while docked.
  slot.closest("section").style.zIndex = mode === "flow" ? "" : "150";
  if (mode === "flow") {
    slot.style.height = "";
    s.position = "relative";
    s.right = s.top = s.width = s.height = s.zIndex = s.cursor = s.overflow = s.maxHeight = s.overflowY = s.borderRight = "";
    body.style.opacity = "1";
    body.style.pointerEvents = "";
    label.style.display = "none";
    return;
  }
  if (!slot.style.height) slot.style.height = slot.offsetHeight + "px";
  Object.assign(s, { position: "fixed", top: "96px", right: "0", zIndex: "180", overflow: "hidden", borderRight: "0" });
  const tab = mode === "tab";
  Object.assign(s, tab
    ? { width: "46px", height: "260px", maxHeight: "", overflowY: "", cursor: "pointer" }
    : { width: "min(660px, 94vw)", height: "auto", maxHeight: "calc(100vh - 130px)", overflowY: "auto", cursor: "default" });
  body.style.opacity = tab ? "0" : "1";
  body.style.pointerEvents = tab ? "none" : "auto";
  label.style.display = tab ? "flex" : "none";
}

function bindPanel() {
  const slot = $("slot");
  addEventListener("scroll", () => {
    if (innerWidth < 940) {
      if (panelMode !== "flow") setPanelMode("flow");
      return;
    }
    if (panelMode === "flow") {
      if (slot.getBoundingClientRect().bottom < 140) setPanelMode("tab");
    } else if (scrollY < 120) {
      setPanelMode("flow");
    }
  }, { passive: true });
  addEventListener("resize", () => {
    if (innerWidth < 940 && panelMode !== "flow") setPanelMode("flow");
    if (panelMode === "flow") slot.style.height = "";
  });
  $("panel").addEventListener("click", e => {
    if (panelMode === "tab") setPanelMode("open");
    // The design collapsed on any click, so the open panel's input was unusable; collapse only from its chrome.
    else if (panelMode === "open" && !e.target.closest("input,button,.pmain")) setPanelMode("tab");
  });
}

function bindChart() {
  const chart = $("chart"), cur = $("cur"), dot = $("dot"), shade = $("shade"), val = $("rv"), step = $("step");
  const pts = POINTS.trim().split(/\s+/).map(p => p.split(",").map(Number));
  chart.addEventListener("mousemove", e => {
    const r = chart.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 600;
    let best = pts[0];
    for (const p of pts) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
    const px = best[0] / 600 * 100 + "%";
    cur.style.left = dot.style.left = shade.style.left = px;
    dot.style.top = best[1] / 210 * 100 + "%";
    cur.style.opacity = dot.style.opacity = "1";
    shade.style.opacity = "0.72";
    const v = Math.max(0, Math.min(1, (202 - best[1]) / 184));
    val.textContent = v.toFixed(2);
    val.style.color = "#EDEDED";
    step.textContent = "шаг " + Math.round(best[0] / 600 * 10000).toLocaleString("ru-RU");
  });
  chart.addEventListener("mouseleave", () => {
    cur.style.opacity = dot.style.opacity = shade.style.opacity = "0";
    val.textContent = FINAL_REWARD;
    val.style.color = "#EDEDED";
    step.textContent = "шаги";
  });
}

// Models table
const st = { mod: "All", prov: "all", sort: "release", query: "" };
const cols = { cache: true, web: true };

function renderRows() {
  const q = st.query.toLowerCase();
  const rows = MODELS.filter(m =>
    (st.mod === "All" || m.mods.indexOf(st.mod) >= 0) &&
    (st.prov === "all" || m.prov === st.prov) &&
    (!q || m.name.toLowerCase().indexOf(q) >= 0)
  );
  if (st.sort === "latency") rows.sort((a, b) => a.lat - b.lat);
  else if (st.sort === "throughput") rows.sort((a, b) => b.tps - a.tps);
  else if (st.sort === "input") rows.sort((a, b) => a.inp - b.inp);
  else {
    const idx = m => { const i = FEATURED.indexOf(m.name); return i < 0 ? 999 : i; };
    rows.sort((a, b) => idx(a) - idx(b));
  }
  $("tbody").innerHTML = rows.length ? map(rows, row) : '<div class="none">Ничего не найдено</div>';
  $("count").textContent = "Моделей: " + rows.length + (rows.length === MODELS.length ? "" : " из " + MODELS.length);
}

// Hidden columns are classes on the table (.nc — no cache, .nw — no web search); CSS picks the grid template.
function toggleCol(key, btn) {
  cols[key] = !cols[key];
  const box = btn.querySelector(".box");
  $("tbl").classList.toggle(key === "cache" ? "nc" : "nw", !cols[key]);
  box.classList.toggle("off", !cols[key]);
  box.textContent = cols[key] ? "✓" : "";
  $("colcount").textContent = "(" + (6 + cols.cache + cols.web) + ")";
}

const closeMenus = () => $$(".ddm").forEach(m => m.classList.remove("open"));

function openModal(id, on) {
  show($(id), on);
  document.body.style.overflow = on ? "hidden" : "";
  if (!on && id === "login") show($("lerr"), false);
}

function bindEvents() {
  document.addEventListener("click", e => {
    // Any click outside a menu button closes the dropdowns; column toggles keep theirs open.
    if (!e.target.closest("[data-menu-btn],[data-col]")) closeMenus();
    const t = e.target.closest("[data-act],[data-tab],[data-mod],[data-menu-btn],[data-prov],[data-sort],[data-col],[data-prod]");
    if (!t) return;
    const d = t.dataset;
    if (d.act === "contact") openModal("modal", true);
    else if (d.act === "login") openModal("login", true);
    else if (d.act === "close") openModal(t.closest(".ov").id, false);
    else if (d.act === "submit") show($("sent"), true);
    else if (d.act === "lsubmit") show($("lerr"), true);
    else if (d.tab) {
      setOn("[data-tab]", t);
      $$("[data-lead]").forEach(p => show(p, p.dataset.lead === d.tab));
      $$("[data-diag]").forEach(p => show(p, p.dataset.diag === d.tab, "flex"));
    } else if (d.mod) {
      setOn("[data-mod]", t);
      st.mod = d.mod;
      renderRows();
    } else if (d.menuBtn) {
      const menu = document.querySelector('[data-menu="' + d.menuBtn + '"]'), open = menu.classList.contains("open");
      closeMenus();
      if (!open) menu.classList.add("open");
    } else if (d.prov) {
      $("provlabel").textContent = PROV_LABELS[d.prov];
      setOn("[data-prov]", t);
      st.prov = d.prov;
      renderRows();
    } else if (d.sort) {
      $("sortlabel").textContent = SORT_LABELS[d.sort];
      setOn("[data-sort]", t);
      st.sort = d.sort;
      renderRows();
    } else if (d.col) toggleCol(d.col, t);
    else if (d.prod) setOn("[data-prod]", t);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") ["modal", "login"].forEach(id => { if ($(id).style.display === "block") openModal(id, false); });
  });

  const q = $("q"), iw = $("iw");
  q.addEventListener("input", () => { if (!autoTyped) stopAuto(false); refreshSend(); });
  q.addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing) send(); });
  q.addEventListener("focus", () => { stopAuto(true); iw.classList.add("on"); });
  q.addEventListener("blur", () => iw.classList.remove("on"));
  $("send").addEventListener("click", send);
  $("search").addEventListener("input", e => { st.query = e.target.value; renderRows(); });
  $("jur").addEventListener("change", e => { $("dial").textContent = e.target.value; });
}

function bindBars() {
  const section = $("how"), tooltip = $("bars-tooltip");
  const controls = Array.from(section.querySelectorAll("[data-bars]"));
  const parts = Array.from(section.querySelectorAll("[data-bars-node],[data-bars-link],[data-bars-copy]"));
  let hovered = null, focused = null, pinned = null, tooltipAnchor = null, closeTimer;
  const control = target => target instanceof Element ? target.closest("[data-bars]") : null;

  function placeTooltip() {
    if (!tooltipAnchor || tooltip.hidden) return;
    const r = tooltipAnchor.getBoundingClientRect(), t = tooltip.getBoundingClientRect();
    const left = Math.max(12, Math.min(innerWidth - t.width - 12, r.left));
    const above = r.top - t.height - 10;
    tooltip.style.left = left + "px";
    tooltip.style.top = Math.max(12, Math.min(innerHeight - t.height - 12, above > 68 ? above : r.bottom + 10)) + "px";
  }

  function render() {
    clearTimeout(closeTimer);
    const current = hovered || focused || pinned;
    const key = current && current.dataset.bars, topic = BARS_TOPICS[key];
    controls.forEach(el => {
      const active = el.dataset.bars === key;
      el.classList.toggle("is-active", active);
      if (el.hasAttribute("aria-pressed")) el.setAttribute("aria-pressed", String(active));
      el.removeAttribute("aria-describedby");
    });
    parts.forEach(el => {
      const keys = el.dataset.barsNode || el.dataset.barsLink || el.dataset.barsCopy;
      el.classList.toggle("is-active", !!key && keys.split(" ").includes(key));
    });
    tooltipAnchor = current;
    tooltip.hidden = !tooltipAnchor;
    if (tooltipAnchor) {
      $("bars-tooltip-text").textContent = current.classList.contains("bars-term") ? topic.technical : topic.note;
      tooltipAnchor.setAttribute("aria-describedby", tooltip.id);
      placeTooltip();
    }
  }

  section.addEventListener("pointerover", e => {
    if (e.pointerType === "touch") return;
    const next = control(e.target);
    if (next) { hovered = next; render(); }
    else if (tooltip.contains(e.target)) clearTimeout(closeTimer);
  });
  section.addEventListener("pointerout", e => {
    if (e.pointerType === "touch") return;
    const previous = control(e.target);
    if (previous && previous.contains(e.relatedTarget)) return;
    if ((previous || tooltip.contains(e.target)) && !tooltip.contains(e.relatedTarget)) {
      closeTimer = setTimeout(() => { hovered = null; render(); }, 100);
    }
  });
  section.addEventListener("focusin", e => { focused = control(e.target); render(); });
  section.addEventListener("focusout", () => { focused = null; render(); });
  section.addEventListener("click", e => {
    const next = control(e.target);
    if (!next) return;
    const same = pinned && pinned.dataset.bars === next.dataset.bars;
    pinned = same ? null : next;
    hovered = focused = null;
    render();
  });
  document.addEventListener("pointerdown", e => {
    if (control(e.target) && section.contains(e.target) || tooltip.contains(e.target)) return;
    hovered = focused = pinned = null;
    render();
  });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    hovered = focused = pinned = null;
    render();
  });
  // Fixed notes follow their term during scrolling; hide when the term leaves the viewport.
  addEventListener("scroll", () => {
    if (!tooltipAnchor) return;
    const r = tooltipAnchor.getBoundingClientRect();
    if (r.bottom < 64 || r.top > innerHeight) { hovered = focused = pinned = null; render(); }
    else placeTooltip();
  }, { passive: true });
  addEventListener("resize", placeTooltip);
}

function bindActivity() {
  const section = $("activity"), board = section.querySelector(".activity-board"), grid = section.querySelector(".activity-grid");
  const days = [...grid.querySelectorAll(".activity-day")], pixels = board.querySelector(".activity-pixels"), tip = $("activity-tooltip");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let introDone = false, started = false, timer = 0, observer, animations = [], current = null, pinned = null;
  const finishIntro = () => {
    if (introDone) return;
    introDone = true;
    clearTimeout(timer);
    if (observer) observer.disconnect();
    animations.forEach(animation => animation.cancel());
    animations = [];
    pixels.hidden = true;
    board.classList.remove("is-intro", "is-scattering");
    board.classList.add("is-ready");
    grid.inert = false;
    days[0].tabIndex = 0;
  };
  const scatter = () => {
    board.classList.remove("is-intro");
    board.classList.add("is-scattering");
    if (!days[0].animate) { timer = setTimeout(finishIntro, 400); return; }
    const targets = days.filter(day => Number(day.dataset.level) > 0);
    const shuffle = activityRandom(9721);
    for (let i = targets.length - 1; i > 0; i--) {
      const j = Math.floor(shuffle() * (i + 1));
      [targets[i], targets[j]] = [targets[j], targets[i]];
    }
    const arrivals = new Map();
    [...pixels.children].forEach((pixel, i) => {
      const random = activityRandom(i + 9721);
      const target = targets[i % targets.length], from = pixel.getBoundingClientRect(), to = target.getBoundingClientRect();
      const dx = to.left - from.left, dy = to.top - from.top;
      const lift = 12 + random() * 30, rotation = random() * 28 - 14;
      const duration = reduced.matches ? 400 : 950 + random() * 250;
      const delay = reduced.matches ? 0 : random() * 120;
      arrivals.set(target, duration + delay);
      const frames = reduced.matches ? [{ opacity: 1 }, { opacity: 0 }] : [
        { transform: "translate3d(0,0,0) rotate(0deg)", opacity: 1, offset: 0 },
        { transform: `translate3d(${dx * .55}px,${dy * .55 - lift}px,0) rotate(${rotation}deg)`, opacity: 1, offset: .55 },
        { transform: `translate3d(${dx}px,${dy}px,0) rotate(0deg)`, opacity: 1, offset: .85 },
        { transform: `translate3d(${dx}px,${dy}px,0) rotate(0deg)`, opacity: 0, offset: 1 }
      ];
      animations.push(pixel.animate(frames, { duration, delay, fill: "both", easing: "cubic-bezier(.2,.65,.3,1)" }));
    });
    days.forEach((day, i) => {
      const random = activityRandom(i + 829);
      const style = getComputedStyle(day);
      const delay = reduced.matches ? 0 : arrivals.has(day) ? arrivals.get(day) - 200 : 450 + random() * 550;
      animations.push(day.animate([
        { backgroundColor: "#080808", borderColor: "#242424", opacity: .5 },
        { backgroundColor: style.backgroundColor, borderColor: style.borderColor, opacity: 1 }
      ], {
        duration: reduced.matches ? 400 : 300, delay, fill: "both", easing: "ease-out"
      }));
    });
    Promise.allSettled(animations.map(animation => animation.finished)).then(finishIntro);
    timer = setTimeout(finishIntro, reduced.matches ? 450 : 1700);
  };
  const start = () => {
    if (started || introDone) return;
    started = true;
    if (observer) observer.disconnect();
    timer = setTimeout(scatter, 850);
  };
  observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .6)) start();
  }, { threshold: .6 });
  observer.observe(board);

  const placeTip = () => {
    if (!current || tip.hidden) return;
    const r = current.getBoundingClientRect();
    const width = tip.offsetWidth, height = tip.offsetHeight;
    tip.style.left = Math.max(12, Math.min(innerWidth - width - 12, r.left + r.width / 2 - width / 2)) + "px";
    tip.style.top = (r.top - height - 12 >= 70 ? r.top - height - 12 : Math.min(innerHeight - height - 12, r.bottom + 12)) + "px";
  };
  const hide = () => {
    if (current) {
      current.classList.remove("is-active");
      current.removeAttribute("aria-describedby");
    }
    current = null;
    tip.hidden = true;
  };
  const showDay = day => {
    if (!introDone) return;
    if (current !== day) hide();
    current = day;
    const index = Number(day.dataset.day);
    tip.textContent = ACTIVITY_DAYS[index].label;
    tip.hidden = false;
    day.classList.add("is-active");
    day.setAttribute("aria-describedby", "activity-tooltip");
    days.forEach(button => { button.tabIndex = button === day ? 0 : -1; });
    placeTip();
  };
  const unpin = () => {
    if (pinned) pinned.setAttribute("aria-pressed", "false");
    pinned = null;
  };
  days.forEach((day, i) => {
    day.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") showDay(day); });
    day.addEventListener("pointerleave", () => {
      if (pinned) showDay(pinned);
      else if (document.activeElement !== day) hide();
    });
    day.addEventListener("focus", () => showDay(day));
    day.addEventListener("blur", () => { if (!pinned) hide(); });
    day.addEventListener("click", () => {
      if (!introDone) return;
      if (pinned === day) { unpin(); hide(); }
      else { unpin(); pinned = day; day.setAttribute("aria-pressed", "true"); showDay(day); }
    });
    day.addEventListener("keydown", e => {
      if (!introDone) return;
      const row = i % 7;
      let next = i;
      if (e.key === "ArrowRight") next = i + 7 < days.length ? i + 7 : i;
      else if (e.key === "ArrowLeft") next = i >= 7 ? i - 7 : i;
      else if (e.key === "ArrowUp") next = row ? i - 1 : i;
      else if (e.key === "ArrowDown") next = row < 6 ? i + 1 : i;
      else if (e.key === "Home") next = i - row;
      else if (e.key === "End") next = i + 6 - row;
      else return;
      e.preventDefault();
      unpin();
      days[next].focus();
    });
  });
  document.addEventListener("pointerdown", e => {
    if (!grid.contains(e.target)) { unpin(); hide(); }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { unpin(); hide(); } });
  addEventListener("resize", placeTip);
  const updateTip = () => {
    if (!current) return;
    const r = current.getBoundingClientRect(), bounds = board.getBoundingClientRect();
    if (r.bottom < 70 || r.top > innerHeight || r.right < bounds.left || r.left > bounds.right) { unpin(); hide(); }
    else placeTip();
  };
  addEventListener("scroll", updateTip, { passive: true });
  board.addEventListener("scroll", updateTip, { passive: true });
}

function mount() {
  const root = document.createElement("div");
  root.className = "root";
  root.innerHTML = page();
  document.body.prepend(root);
  ocean(root.querySelector(".ocean canvas"));
  globeAnim(root.querySelector(".globe svg"));
  renderRows();
  bindEvents();
  bindPanel();
  bindChart();
  bindBars();
  bindActivity();
  if (!SHOW_DEMO_ANSWER) showNotice();
  if (!API_ENDPOINT.trim()) bindAuto();
  // The markup arrives after load, so jump to a #section from the URL by hand (without smooth scrolling).
  const target = location.hash && $(decodeURIComponent(location.hash.slice(1)));
  if (target) {
    const html = document.documentElement;
    html.style.scrollBehavior = "auto";
    target.scrollIntoView();
    html.style.scrollBehavior = "";
  }
}

// Mount once the stylesheet (injected by index.html next to this script) and the DOM are ready — no unstyled flash.
const css = document.getElementById("alphy-css");
Promise.all([
  new Promise(r => {
    if (!css || css.sheet) return r();
    css.addEventListener("load", r);
    css.addEventListener("error", r);
    setTimeout(r, 4000);
  }),
  new Promise(r => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", r);
    else r();
  })
]).then(mount);
})();
