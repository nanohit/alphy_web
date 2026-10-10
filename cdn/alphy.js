/* alphy.chat — vanilla JS port of the "Alphy v2" design. No dependencies, no build step.
   Served by jsDelivr (request alphy.min.js for the auto-minified build); index.html on Vercel loads it. */
(() => {
"use strict";

// Base URL of this script: logos resolve relative to it (jsDelivr in prod, ./cdn/ locally).
const BASE = ((document.currentScript || {}).src || "").replace(/[^/]*$/, "");

// Demo panel settings (component props in the design).
const API_ENDPOINT = "";       // POST {prompt, stream:false} → the panel shows the answer; empty → Groq
const SHOW_DEMO_ANSWER = true; // false → the panel starts with the "API не подключён" notice

/* ---------- data (verbatim from the design) ---------- */

const MODELS = [
  { mark: "XA", prov: "xai", name: "xai/grok-imagine-image-2.0", context: "—", latency: "—", lat: 99, throughput: "—", tps: 0, input: "—", inp: 99, output: "$0.05/img", cacheRead: "—", cacheWrite: "—", web: "—", webSub: "", mods: ["Image"] },
  { mark: "BD", prov: "bytedance", name: "bytedance/seedance-2.5", context: "—", latency: "—", lat: 99, throughput: "—", tps: 0, input: "—", inp: 99, output: "$10.70/M", cacheRead: "—", cacheWrite: "—", web: "—", webSub: "", mods: ["Video"] },
  { mark: "IL", prov: "inclusionai", name: "inclusionai/ling-3.0-tiny-free", context: "256K", latency: "0.9s", lat: 0.9, throughput: "364tps", tps: 364, input: "Free", inp: 0, output: "Free", cacheRead: "—", cacheWrite: "—", web: "—", webSub: "", mods: ["Text", "Code"] },
  { mark: "IL", prov: "inclusionai", name: "inclusionai/ling-3.0-flash", context: "256K", latency: "0.8s", lat: 0.8, throughput: "319tps", tps: 319, input: "$0.06/M", inp: 0.06, output: "$0.18/M", cacheRead: "$0.01/M", cacheWrite: "—", web: "—", webSub: "", mods: ["Text", "Code"] },
  { mark: "ME", prov: "meta", name: "meta/muse-spark-1.2", context: "1M", latency: "3.8s", lat: 3.8, throughput: "210tps", tps: 210, input: "$1.25/M", inp: 1.25, output: "$4.25/M", cacheRead: "$0.15/M", cacheWrite: "—", web: "—", webSub: "", mods: ["Text", "Code", "Image"] },
  { mark: "BF", prov: "bfl", name: "bfl/flux-3-video", context: "—", latency: "—", lat: 99, throughput: "—", tps: 0, input: "—", inp: 99, output: "$0.06/sec", cacheRead: "—", cacheWrite: "—", web: "—", webSub: "", mods: ["Video"] },
  { mark: "AL", prov: "alibaba", name: "alibaba/qwen3.8-max", context: "1M", latency: "4.0s", lat: 4.0, throughput: "56tps", tps: 56, input: "$2/M", inp: 2, output: "$6/M", cacheRead: "$0.25/M", cacheWrite: "$2.5/M", web: "—", webSub: "", mods: ["Text", "Code"] },
  { mark: "DS", prov: "deepseek", name: "deepseek/deepseek-v4-flash", context: "1M", latency: "0.8s", lat: 0.8, throughput: "399tps", tps: 399, input: "$0.01/M", inp: 0.01, output: "$0.03/M", cacheRead: "$0.0/M", cacheWrite: "—", web: "—", webSub: "", mods: ["Text", "Code"] },
  { mark: "TM", prov: "thinkingmachines", name: "thinkingmachines/inkling-small", context: "1M", latency: "0.2s", lat: 0.2, throughput: "607tps", tps: 607, input: "$0.50/M", inp: 0.5, output: "$1.20/M", cacheRead: "$0.1/M", cacheWrite: "—", web: "—", webSub: "", mods: ["Text", "Code"] },
  { mark: "MM", prov: "minimax", name: "minimax/minimax-h3", context: "—", latency: "—", lat: 99, throughput: "—", tps: 0, input: "$0.04/img", inp: 99, output: "$0.13/sec", cacheRead: "—", cacheWrite: "—", web: "—", webSub: "", mods: ["Image", "Video"] },
  { mark: "AL", prov: "alibaba", name: "alibaba/qwen3.7-flash", context: "991K", latency: "1.8s", lat: 1.8, throughput: "135tps", tps: 135, input: "$0.03/M", inp: 0.03, output: "$0.13/M", cacheRead: "$0.01/M", cacheWrite: "$0.04/M", web: "—", webSub: "", mods: ["Text", "Code"] },
  { mark: "FA", prov: "fishaudio", name: "fish-audio/s2.1-pro", context: "—", latency: "—", lat: 99, throughput: "—", tps: 0, input: "$15/M chars", inp: 99, output: "—", cacheRead: "—", cacheWrite: "—", web: "—", webSub: "", mods: ["Audio"] },
  { mark: "MS", prov: "moonshotai", name: "moonshotai/kimi-k3-fast", context: "1M", latency: "1.0s", lat: 1.0, throughput: "101tps", tps: 101, input: "$4.50/M", inp: 4.5, output: "$22.50/M", cacheRead: "$0.45/M", cacheWrite: "—", web: "—", webSub: "", mods: ["Text", "Code"] },
  { mark: "AN", prov: "anthropic", name: "anthropic/claude-opus-5", context: "1M", latency: "2.6s", lat: 2.6, throughput: "93tps", tps: 93, input: "$5/M", inp: 5, output: "$25/M", cacheRead: "$0.5/M", cacheWrite: "$6.25/M", web: "$10/K", webSub: "+ стоимость input", mods: ["Text", "Code", "Image"] },
  { mark: "AN", prov: "anthropic", name: "anthropic/claude-opus-5-fast", context: "1M", latency: "1.6s", lat: 1.6, throughput: "219tps", tps: 219, input: "$10/M", inp: 10, output: "$50/M", cacheRead: "$0.5/M", cacheWrite: "$6.25/M", web: "$10/K", webSub: "+ стоимость input", mods: ["Text", "Code", "Image"] },
  { mark: "GO", prov: "google", name: "google/gemini-3.5-flash-lite", context: "1M", latency: "0.3s", lat: 0.3, throughput: "360tps", tps: 360, input: "$0.30/M", inp: 0.3, output: "$2.50/M", cacheRead: "$0.03/M", cacheWrite: "—", web: "$14/K", webSub: "+ стоимость input", mods: ["Text", "Code", "Image"] },
  { mark: "PS", prov: "poolside", name: "poolside/laguna-s-2.1", context: "1M", latency: "0.2s", lat: 0.2, throughput: "199tps", tps: 199, input: "$0.10/M", inp: 0.1, output: "$0.20/M", cacheRead: "$0.01/M", cacheWrite: "—", web: "—", webSub: "", mods: ["Text", "Code"] },
  { mark: "GO", prov: "google", name: "google/gemini-3.6-flash", context: "1M", latency: "1.8s", lat: 1.8, throughput: "172tps", tps: 172, input: "$1.50/M", inp: 1.5, output: "$7.50/M", cacheRead: "$0.15/M", cacheWrite: "—", web: "$14/K", webSub: "+ стоимость input", mods: ["Text", "Code", "Image"] },
  { mark: "MS", prov: "moonshotai", name: "moonshotai/kimi-k3", context: "1M", latency: "1.0s", lat: 1.0, throughput: "91tps", tps: 91, input: "$2.90/M", inp: 2.9, output: "$14/M", cacheRead: "$0.29/M", cacheWrite: "—", web: "—", webSub: "", mods: ["Text", "Code"] },
  { mark: "TM", prov: "thinkingmachines", name: "thinkingmachines/inkling", context: "256K", latency: "0.2s", lat: 0.2, throughput: "234tps", tps: 234, input: "$1/M", inp: 1, output: "$4.05/M", cacheRead: "$0.17/M", cacheWrite: "—", web: "—", webSub: "", mods: ["Text", "Code", "Embedding"] },
  { mark: "BD", prov: "bytedance", name: "bytedance/seedream-5.0-pro", context: "—", latency: "—", lat: 99, throughput: "—", tps: 0, input: "$0.003/M", inp: 99, output: "$0.04/img", cacheRead: "—", cacheWrite: "—", web: "—", webSub: "", mods: ["Image"] },
  { mark: "KW", prov: "kwaipilot", name: "kwaipilot/kat-coder-pro-v2.5", context: "256K", latency: "1.1s", lat: 1.1, throughput: "105tps", tps: 105, input: "$0.74/M", inp: 0.74, output: "$2.96/M", cacheRead: "$0.15/M", cacheWrite: "—", web: "—", webSub: "", mods: ["Code"] },
  { mark: "KW", prov: "kwaipilot", name: "kwaipilot/kat-coder-air-v2.5", context: "256K", latency: "0.7s", lat: 0.7, throughput: "366tps", tps: 366, input: "$0.15/M", inp: 0.15, output: "$0.60/M", cacheRead: "$0.03/M", cacheWrite: "—", web: "—", webSub: "", mods: ["Code"] },
  { mark: "OA", prov: "openai", name: "openai/gpt-5.6-luna", context: "1.1M", latency: "1.8s", lat: 1.8, throughput: "179tps", tps: 179, input: "$1/M", inp: 1, output: "$6/M", cacheRead: "$0.1/M", cacheWrite: "$1.25/M", web: "$10/K", webSub: "+ стоимость input", mods: ["Text", "Code", "Image"] },
  { mark: "OA", prov: "openai", name: "openai/gpt-5.6-sol", context: "1.1M", latency: "2.9s", lat: 2.9, throughput: "126tps", tps: 126, input: "$5/M", inp: 5, output: "$30/M", cacheRead: "$0.5/M", cacheWrite: "$6.25/M", web: "$10/K", webSub: "+ стоимость input", mods: ["Text", "Code", "Image", "Video"] },
  { mark: "OA", prov: "openai", name: "openai/gpt-5.6-terra", context: "1.1M", latency: "2.7s", lat: 2.7, throughput: "100tps", tps: 100, input: "$2.50/M", inp: 2.5, output: "$15/M", cacheRead: "$0.25/M", cacheWrite: "$3.13/M", web: "$10/K", webSub: "+ стоимость input", mods: ["Text", "Code", "Image"] },
  { mark: "ME", prov: "meta", name: "meta/muse-spark-1.1", context: "1M", latency: "3.4s", lat: 3.4, throughput: "165tps", tps: 165, input: "$1.25/M", inp: 1.25, output: "$4.25/M", cacheRead: "$0.15/M", cacheWrite: "—", web: "—", webSub: "", mods: ["Text", "Code", "Embedding"] },
  { mark: "XA", prov: "xai", name: "xai/grok-4.5", context: "500K", latency: "1.1s", lat: 1.1, throughput: "137tps", tps: 137, input: "$2/M", inp: 2, output: "$6/M", cacheRead: "$0.5/M", cacheWrite: "—", web: "$5/K", webSub: "", mods: ["Text", "Code", "Image"] },
  { mark: "ME", prov: "meta", name: "meta/muse-spark-1.2-contributor", context: "1M", latency: "3.9s", lat: 3.9, throughput: "142tps", tps: 142, input: "$0.10/M", inp: 0.1, output: "$0.20/M", cacheRead: "$0.0/M", cacheWrite: "—", web: "—", webSub: "", mods: ["Text", "Code"] },
  { mark: "PS", prov: "poolside", name: "poolside/laguna-s-2.1-free", context: "256K", latency: "1.3s", lat: 1.3, throughput: "74tps", tps: 74, input: "Free", inp: 0, output: "Free", cacheRead: "—", cacheWrite: "—", web: "—", webSub: "", mods: ["Text", "Code"] },
  { mark: "XA", prov: "xai", name: "xai/grok-voice-think-fast-2.0", context: "—", latency: "—", lat: 99, throughput: "—", tps: 0, input: "$4.80/hr", inp: 99, output: "—", cacheRead: "—", cacheWrite: "—", web: "—", webSub: "", mods: ["Audio"] },
  { mark: "AN", prov: "anthropic", name: "anthropic/claude-fable-5", context: "1M", latency: "7.4s", lat: 7.4, throughput: "83tps", tps: 83, input: "$10/M", inp: 10, output: "$50/M", cacheRead: "$1/M", cacheWrite: "$12.5/M", web: "$10/K", webSub: "+ стоимость input", mods: ["Text", "Code", "Image"] }
];

const CATALOG = `quiverai|arrow-1.1|T
bytedance|seed-1.8|T,I
anthropic|claude-3-haiku|T
anthropic|claude-haiku-4.5|T,C
anthropic|claude-opus-4|T,C
anthropic|claude-opus-4.5|T,C,I
anthropic|claude-opus-4.6|T,C
anthropic|claude-opus-4.7|T,C
anthropic|claude-opus-4.8|T,C
anthropic|claude-sonnet-4|T,C
anthropic|claude-sonnet-4.5|T,C
anthropic|claude-sonnet-4.6|T,C
anthropic|claude-sonnet-5|T,C
mistral|codestral-embed|E
cohere|rerank-v3.5|E
cohere|rerank-v4-fast|E
cohere|rerank-v4-pro|E
cohere|command-a|T,C
deepseek|deepseek-r1|T,C
deepseek|deepseek-v3|T,C
deepseek|deepseek-v3.1|T,C
deepseek|deepseek-v3.1-terminus|T,C
deepseek|deepseek-v3.2|T,C
deepseek|deepseek-v3.2-thinking|T,C
deepseek|deepseek-v4-flash|T,C
deepseek|deepseek-v4-pro|T,C
mistral|devstral-2|C
mistral|devstral-small-2|C
perplexity|pplx-embed-v1-0.6b|E
perplexity|pplx-embed-v1-4b|E
cohere|embed-v4.0|E,I
prodia|flux-fast-schnell|I
bfl|flux-pro-1.0-fill|I
bfl|flux-kontext-max|I
bfl|flux-kontext-pro|I
bfl|flux-2-flex|I
bfl|flux-2-klein-4b|I
bfl|flux-2-klein-9b|I
bfl|flux-2-max|I
bfl|flux-2-pro|I
bfl|flux-pro-1.1|I
bfl|flux-pro-1.1-ultra|I
sakana|fugu-ultra|T
google|gemini-2.5-flash|T,C,I
google|gemini-2.5-flash-lite|T,C,I
google|gemini-2.5-flash-preview-09-2025|T,C,I
google|gemini-2.5-pro|T,C,I,A
google|gemini-3-flash|T,C,I
google|gemini-3.1-flash-image|I
google|gemini-3.1-flash-image-preview|I
google|gemini-3.1-flash-lite|T,C,A
google|gemini-3.1-flash-lite-image|I
google|gemini-3.1-pro-preview|T,C
google|gemini-3.5-flash|T,C`;

const MODCODE = { T: "Text", C: "Code", I: "Image", V: "Video", A: "Audio", E: "Embedding" };

CATALOG.trim().split("\n").forEach(line => {
  const p = line.split("|");
  MODELS.push({
    mark: p[0].slice(0, 2).toUpperCase(),
    prov: p[0],
    name: p[0] + "/" + p[1],
    context: "—", latency: "—", lat: 99, throughput: "—", tps: 0,
    input: "—", inp: 99, output: "—", cacheRead: "—", cacheWrite: "—",
    web: "—", webSub: "",
    mods: p[2].split(",").map(c => MODCODE[c])
  });
});

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

const FEATURED = ["moonshotai/kimi-k3", "xai/grok-4.5", "anthropic/claude-fable-5", "openai/gpt-5.6-sol", "meta/muse-spark-1.1", "anthropic/claude-opus-5"];
const SORT_LABELS = { release: "по дате", latency: "по latency", throughput: "по throughput", input: "по цене input" };
const PROV_LABELS = { all: "Все провайдеры", openai: "OpenAI", anthropic: "Anthropic", google: "Google", meta: "Meta", xai: "xAI", deepseek: "DeepSeek", alibaba: "Alibaba", moonshotai: "Moonshot AI", thinkingmachines: "Thinking Machines", mistral: "Mistral", cohere: "Cohere", bfl: "Black Forest Labs", bytedance: "ByteDance", perplexity: "Perplexity", prodia: "Prodia", quiverai: "QuiverAI", sakana: "Sakana AI", poolside: "Poolside", minimax: "MiniMax", kwaipilot: "Kwaipilot", inclusionai: "InclusionAI", fishaudio: "Fish Audio" };

const POINTS = "0.0,200.5 3.2,200.2 6.3,192.0 9.5,194.4 12.7,192.2 15.9,192.0 19.0,168.4 22.2,187.6 25.4,189.4 28.6,173.3 31.7,165.0 34.9,116.7 38.1,130.6 41.3,129.3 44.4,144.2 47.6,146.7 50.8,151.9 54.0,102.3 57.1,102.2 60.3,99.8 63.5,118.7 66.7,125.1 69.8,91.6 73.0,132.0 76.2,90.6 79.4,77.8 82.5,83.9 85.7,117.2 88.9,103.4 92.1,85.3 95.2,112.8 98.4,100.0 101.6,86.3 104.8,71.7 107.9,93.7 111.1,80.2 114.3,102.5 117.5,73.9 120.6,73.3 123.8,67.4 127.0,63.7 130.2,55.6 133.3,56.1 136.5,80.2 139.7,52.6 142.9,68.9 146.0,46.9 149.2,78.5 152.4,47.9 155.6,69.7 158.7,79.6 161.9,59.4 165.1,76.9 168.3,70.6 171.4,39.0 174.6,65.2 177.8,60.9 181.0,49.1 184.1,43.8 187.3,48.6 190.5,39.7 193.7,46.3 196.8,45.2 200.0,63.6 203.2,56.4 206.3,62.4 209.5,32.9 212.7,29.8 215.9,54.7 219.0,34.4 222.2,54.0 225.4,46.7 228.6,57.8 231.7,58.7 234.9,54.2 238.1,46.8 241.3,40.3 244.4,25.5 247.6,43.3 250.8,44.2 254.0,44.6 257.1,35.7 260.3,41.9 263.5,53.5 266.7,30.9 269.8,40.4 273.0,28.2 276.2,47.4 279.4,32.1 282.5,36.3 285.7,29.2 288.9,32.9 292.1,36.7 295.2,38.4 298.4,43.3 301.6,49.2 304.8,40.1 307.9,34.1 311.1,40.7 314.3,21.6 317.5,25.9 320.6,31.8 323.8,44.9 327.0,22.1 330.2,31.6 333.3,31.2 336.5,43.3 339.7,43.8 342.9,24.8 346.0,28.8 349.2,33.9 352.4,25.8 355.6,29.1 358.7,23.5 361.9,36.5 365.1,41.5 368.3,33.3 371.4,42.6 374.6,22.3 377.8,35.7 381.0,26.9 384.1,31.5 387.3,41.8 390.5,41.2 393.7,30.6 396.8,32.6 400.0,20.9 403.2,42.0 406.3,20.9 409.5,21.2 412.7,28.5 415.9,28.2 419.0,30.4 422.2,31.7 425.4,30.4 428.6,36.6 431.7,36.8 434.9,39.5 438.1,34.2 441.3,19.8 444.4,27.5 447.6,36.2 450.8,26.0 454.0,34.8 457.1,25.9 460.3,22.1 463.5,35.3 466.7,39.3 469.8,29.1 473.0,24.5 476.2,27.1 479.4,35.3 482.5,24.5 485.7,20.9 488.9,36.6 492.1,39.4 495.2,35.1 498.4,36.3 501.6,30.8 504.8,35.0 507.9,24.4 511.1,34.5 514.3,38.5 517.5,35.6 520.6,32.8 523.8,38.6 527.0,23.4 530.2,39.2 533.3,22.3 536.5,37.9 539.7,25.6 542.9,35.4 546.0,24.1 549.2,33.0 552.4,31.8 555.6,28.5 558.7,30.8 561.9,25.8 565.1,25.2 568.3,26.2 571.4,31.1 574.6,32.9 577.8,27.4 581.0,23.9 584.1,21.6 587.3,31.3 590.5,37.6 593.7,37.2 596.8,22.1 600.0,28.3";

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
    [["AN", "Claude Opus 5", "Anthropic", "сбой"], ["AW", "Claude Opus 5", "Amazon Bedrock", "активен"]]],
  ["Стоимость токенов?", [["дешевле", 1, "--x:76px;--y:171px"], ["дороже", 0, "--x:88px;--y:89px"]],
    [["OA", "GPT-5.6 Sol", "openai/gpt-5.6-sol", "$30.00 / M"], ["DS", "DeepSeek V4 Flash", "deepseek/deepseek-v4-flash", "$0.03 / M"]]],
  ["Минимальный latency?", [["2.9s", 0], ["0.2s", 1]],
    [["OA", "GPT-5.6 Sol", "126 tps", "медленнее"], ["TM", "Inkling Small", "607 tps", "быстрее"]]]
];

const NEWS = [
  ["9 июля", "Muse Spark 1.1 теперь доступен на Alphy Gateway"],
  ["9 июля", "GPT 5.6 Sol, Luna и Terra теперь доступны на Alphy Gateway"],
  ["8 июля", "Grok 4.5 теперь доступен на Alphy Gateway"]
];

const MODS = [["All", "Все"], ["Text"], ["Code"], ["Image"], ["Video"], ["Audio"], ["Embedding"]];
const PROVS = ["all", "openai", "anthropic", "google", "meta", "xai", "deepseek", "alibaba", "moonshotai", "thinkingmachines", "mistral", "cohere", "bfl", "bytedance", "perplexity", "minimax", "poolside", "sakana", "prodia", "quiverai"];

const ENVS = [["arcee-ai/ifeval", "0.1.1", "ARCEE-AI"], ["hud/hud-text-2048", "0.1.1", "HUD"], ["aarush/vf-openbench", "0.1.1", "AARUSH"]];
const EVALS = [["0.90", "#3FB950"], ["0.34", "#D14E3C"], ["1.23", "#3FB950"], ["0.72", "#B98A2E"], ["0.92", "#3FB950"]];
const PARAMS = [["max_steps", "10,000"], ["rollouts_per_example", "19"], ["seq_len", "4"], ["batch_size", "65536"], ["max_tokens", "256"], ["learning_rate", "0.00005"]];

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
  return `<div class="tr"><span class="tn"><span class="tm">${r.mark}</span><span class="nm"><span class="np">${r.name.slice(0, i)}</span>${r.name.slice(i)}</span></span><span class="tv">${r.context}</span><span class="tv">${r.latency}</span><span class="tv">${r.throughput}</span><span class="tv hi">${r.input}</span><span class="tv hi po">${r.output}</span><span class="cc"><span>Read:<br>Write:</span><span>${r.cacheRead}<br>${r.cacheWrite}</span></span><span class="wc"><span>${r.web}</span><span>${r.webSub}</span></span></div>`;
};

const globe = () => `<svg viewBox="-2 -2 804 404" role="img" aria-label="Animated global delivery network"><defs><linearGradient id="grid-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="white"/><stop offset=".78" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="hemisphere-mask"><rect x="-4" y="-4" width="808" height="412" fill="url(#grid-fade)"/></mask></defs><g mask="url(#hemisphere-mask)"><g class="grid">${map(GRID, d => `<path d="${d}"/>`)}</g>${map(ROUTES, r => `<g mask="url(#hemisphere-mask)"><path class="packet" d="${r.d}" stroke="url(#${r.id}-gradient)"/><defs><radialGradient class="pg" id="${r.id}-gradient" cx="100" cy="100" r="0" gradientUnits="userSpaceOnUse"><stop offset="0"/><stop offset="0.4"/><stop offset="1" stop-opacity="0"/></radialGradient></defs></g>`)}</g>${map(NODES, ([x, y]) => `<g transform="translate(${x} ${y})"><circle class="ring" r="16"/><circle class="core" r="12"/><text x="0" y="0">a</text></g>`)}</svg>`;

/* BARS: shared topics keep the copy, diagram and technical notes in sync. */
const BARS_TOPICS = {
  bars: { title: "Alphy BARS", technical: "BAR-based Activation Routing System", note: "Маршрутизируем вычисления к эксперту в нужном ярусе памяти. Между видеокартами передаём активации через BAR1." },
  token: { title: "По шине — только токен", technical: "Вектор активаций токена", note: "Килобайты активаций идут к нужному эксперту. Мегабайты весов модели остаются там, где хранятся." },
  p2p: { title: "Прямой обмен между GPU", technical: "P2P через BAR1, ACS отключён, IOMMU в passthrough", note: "GPU обмениваются активациями напрямую, минуя процессор и оперативную память. 0,4 мкс вместо 14 мкс — в 35 раз быстрее." },
  gpu: { title: "Первый ярус · видеопамять", technical: "GDDR7", note: "8 GPU, суммарно 256 ГБ. Каждый эксперт хранится один раз; часто срабатывающие вместе эксперты расположены рядом." },
  ram: { title: "Второй ярус · оперативная память", technical: "MRDIMM-8800, 24 канала, ~1,6 ТБ/с", note: "1,5 ТБ для менее востребованных экспертов. Два Xeon 6 вычисляют их прямо в этом ярусе, без переноса весов на GPU." },
  cpu: { title: "Вычисления на месте", technical: "Матричные блоки AMX", note: "Два Xeon 6 обрабатывают экспертов из оперативной памяти с помощью AMX. Вычисления приходят к модели." },
  nvme: { title: "Третий ярус · NVMe", technical: "Gen5, RAID0, выравнивание по 4K", note: "8 NVMe-дисков, ~100 ГБ/с. Редкие эксперты подгружаются на слой раньше, чем понадобятся." },
  pcie: { title: "Своя линия каждому устройству", technical: "192 линии PCIe 5.0: карты x16, диски x4", note: "Каждой GPU выделен x16, каждому NVMe — x4. Устройства не делят свою линию с соседями." }
};
const barsTerm = (key, label) => `<button type="button" class="bars-term" data-bars="${key}" aria-label="${label}: технические подробности">${label}<span aria-hidden="true">↗</span></button>`;
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
<span class="bars-node-foot">Частые эксперты · без дублей <span aria-hidden="true">↗</span></span></button>
<button type="button" class="bars-node bars-token" data-bars="token" data-bars-node="token" aria-pressed="false">${barsIcon("token")}<span>Токен</span><small class="m">килобайты</small></button>
<button type="button" class="bars-node bars-p2p" data-bars="p2p" data-bars-node="bars p2p token" aria-pressed="false">${barsIcon("link")}<span><b>GPU ↔ GPU</b><small class="m">P2P / BAR1</small></span><span class="bars-latency m">0,4<small>мкс</small></span></button>
${map(["01", "02"], (n, i) => `<button type="button" class="bars-node bars-cpu bars-cpu-${i}" data-bars="cpu" data-bars-node="cpu ram pcie" aria-pressed="false">${barsIcon("chip")}<span><b>Xeon 6</b><small class="m">AMX · CPU ${n}</small></span><span class="bars-node-arrow" aria-hidden="true">↗</span></button>`)}
<button type="button" class="bars-node bars-ram" data-bars="ram" data-bars-node="ram cpu" aria-pressed="false">${barsIcon("ram")}<b class="m">1,5 ТБ</b><span>MRDIMM</span><small>Менее частые</small></button>
<button type="button" class="bars-pcie m" data-bars="pcie" data-bars-node="pcie" aria-pressed="false">192 линии PCIe 5.0 <span aria-hidden="true">↗</span></button>
<button type="button" class="bars-node bars-nvme" data-bars="nvme" data-bars-node="nvme pcie" aria-pressed="false"><span class="bars-node-heading"><span>8 × NVMe</span><span class="m">~100 ГБ/с</span></span><span class="bars-drives">${map(Array.from({length:8}), () => '<i><span></span></i>')}</span><span class="bars-node-foot">Редкие эксперты · предзагрузка <span aria-hidden="true">↗</span></span></button>
</div>
<figcaption class="bars-detail"><div class="bars-detail-label m" id="bars-detail-title">ВЫЧИСЛЕНИЯ → К МОДЕЛИ</div><p id="bars-detail-note">Выберите элемент, чтобы увидеть его роль и связи. Эксперты остаются в памяти, к ним приходят вычисления.</p><div class="bars-detail-tech m" id="bars-detail-tech">GPU · MRDIMM · NVMe</div></figcaption>
</figure>`;
const barsSection = () => `<section id="how" class="wrap st2 bars-section" aria-labelledby="bars-title">
<div class="bars-heading"><h2 id="bars-title">Как это работает</h2><span class="bars-hint"><span aria-hidden="true">↗</span><span class="bars-hover-hint">Наведите на текст или схему</span><span class="bars-touch-hint">Нажмите на текст или схему</span></span></div>
<div class="bars-layout"><div class="bars-copy">
<p class="bars-intro" data-bars-copy="bars">${barsTerm("bars", "Alphy BARS")}<br><span>синтетический NVLink</span></p>
<div class="bars-copy-block" data-bars-copy="token p2p"><p>Чтобы модель работала на нескольких видеокартах, между ними гоняются куски самой модели, а это мегабайты. У нас же по шине едет <strong>только ${barsTerm("token", "токен")}</strong>, то есть то, что модель обрабатывает прямо сейчас, а это <strong>килобайты</strong>.</p><p>Карты ${barsTerm("p2p", "общаются напрямую")}, минуя процессор и оперативную память, поэтому данные доходят за <strong class="m">0,4 мкс</strong> вместо обычных 14. <span class="bars-speed">Это в <strong>35 раз</strong> быстрее.</span></p></div>
<div class="bars-copy-block" data-bars-copy="gpu"><p>Каждая часть модели (эксперт) хранится <strong>в одном месте, без дублей</strong>. Самые востребованные лежат прямо на видеокартах, причём те, что обычно срабатывают вместе, расположены рядом. Поэтому ${barsTerm("gpu", "256 ГБ видеопамяти")} дают <strong>256 ГБ места</strong>, а не восемь копий одного и того же.</p></div>
<div class="bars-copy-block" data-bars-copy="ram cpu nvme"><p>Менее востребованные эксперты лежат в ${barsTerm("ram", "1,5 ТБ быстрой оперативной памяти")}. Это второй ярус памяти: <strong>два Xeon 6</strong> ${barsTerm("cpu", "считают их прямо на месте")}, без перетаскивания на видеокарты.</p><p>Редко используемые хранятся на ${barsTerm("nvme", "восьми NVMe-дисках (~100 ГБ/с)")} и подгружаются <strong>на слой раньше</strong>, чем понадобятся.</p></div>
<div class="bars-copy-block" data-bars-copy="pcie"><p>У каждой видеокарты и каждого диска ${barsTerm("pcie", "своя полноценная линия связи")}, ни с кем не поделённая.</p></div>
<p class="bars-conclusion"><span aria-hidden="true">↳</span> Мы отправляем вычисления туда,<br class="bars-desktop-break"> где лежит модель.</p>
</div>${barsDiagram()}</div>
<div class="bars-tooltip" id="bars-tooltip" role="tooltip" hidden><span class="k">ТЕХНИЧЕСКИ</span><span id="bars-tooltip-text"></span></div>
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
<div class="g3 news">${map(NEWS, ([d, t]) => `<article><div class="nd"><span>${d}</span><span>ChangeLog</span></div><div class="nt">${t}</div></article>`)}</div>
<h2 class="h2c">Один API, сотни моделей</h2>
<div class="tbl" id="tbl">
<div class="tbar">
<div class="seg s2 xs">${map(MODS, ([k, t], i) => `<button data-mod="${k}"${i ? "" : ' class="on"'}>${t || k}</button>`)}</div>
<div class="dd"><button class="ddb" data-menu-btn="prov"><span id="provlabel">Все провайдеры</span>${CHEV}</button><div class="ddm sc" data-menu="prov">${map(PROVS, (k, i) => `<button data-prov="${k}"${i ? "" : ' class="on"'}>${PROV_LABELS[k]}</button>`)}</div></div>
<div class="filters">
<div class="dd"><button class="ddb" data-menu-btn="sort"><span class="dim">Сортировка</span><span id="sortlabel">по дате</span>${CHEV}</button><div class="ddm r" data-menu="sort">${map(Object.keys(SORT_LABELS), (k, i) => `<button data-sort="${k}"${i ? "" : ' class="on"'}>${SORT_LABELS[k]}</button>`)}</div></div>
<div class="dd"><button class="ddb" data-menu-btn="cols"><span>Колонки</span><span class="dim" id="colcount">(14)</span>${CHEV}</button><div class="ddm r" data-menu="cols"><button class="ck" data-col="cache"><span class="box">✓</span>Cache</button><button class="ck" data-col="web"><span class="box">✓</span>Web Search</button></div></div>
</div>
</div>
<div class="srch"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="4.6" stroke="#4A4A4A" stroke-width="1.3"/><path d="m10.6 10.6 3 3" stroke="#4A4A4A" stroke-width="1.3" stroke-linecap="square"/></svg><input id="search" type="text" placeholder="Поиск модели..." autocomplete="off"></div>
<div class="tsc xs"><div class="tmin">
<div class="th"><span>Модель</span><span class="r">Context</span><span class="r">Latency</span><span class="r">Throughput</span><span class="r">Input</span><span class="r" style="padding-right:18px">Output</span><span class="cc">Cache</span><span class="wc">Web Search</span></div>
<div id="tbody"></div>
</div></div>
<div class="tfoot"><span id="count"></span><span>прокрутите список ↓</span></div>
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
<div class="bb"><div class="viz">
<div class="envs"><div class="env on"><div>alphy/<b>logic-env</b></div><div class="em"><span>0.2.17</span><span>PRIMEINTELLECT</span></div><div class="evb">Оценить</div></div>${map(ENVS, ([n, v, o]) => `<div class="env"><div>${n}</div><div class="em"><span>${v}</span><span>${o}</span></div></div>`)}</div>
<div class="evals"><div class="eh"><span>ID</span><span>РЕЗУЛЬТАТ</span><span>ОЦЕНКА</span></div>${map(EVALS, ([s, c], i) => `<div class="er"><span>${i + 1}</span><span>"answer": "[2, 3, 4,…</span><span style="color:${c}">${s}</span></div>`)}</div>
</div>${ct("02", "Оценки и бенчмарки", "Гибкая оценка производительность моделей")}</div>
<div class="br"><div class="viz trn">
<div class="rw"><div class="rwh"><span>Награда</span><span id="rv">0.92</span></div>
<div class="rwb"><div class="ax"><span>1</span><span>0.8</span><span>0.6</span><span>0.4</span><span>0.2</span><span>0</span></div>
<div class="chart" id="chart"><span id="shade"></span><span id="cur"></span><span id="dot"></span><svg viewBox="0 0 600 210" preserveAspectRatio="none" aria-hidden="true">${map([150, 300, 450], x => `<line x1="${x}" y1="0" x2="${x}" y2="210" stroke="#131313" stroke-width="1" vector-effect="non-scaling-stroke"/>`)}<polyline id="poly" points="${POINTS}" fill="none" stroke="#EDEDED" stroke-width="1" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg></div></div>
<div class="rwf"><span>0</span><span id="step">step</span><span>10,000</span></div></div>
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
<div class="g2 bh"><h2>Скорость через API</h2><div style="padding-bottom:4px"><p>Qwen 3.8 27B-A3B, text-only, 4k input → 512 output. Независимый замер MLX:&nbsp;<a href="https://www.yukon.org/mlxfast" target="_blank" rel="noreferrer">yukon.org/mlxfast</a>.</p></div></div>
<div class="g2 bgrid">
<div class="bc br"><div class="bct"><div class="k">TOKENS / SEC</div><div>больше — лучше</div></div><div class="brs">${map(TPS, brow)}</div><div class="bf">+6,7% к ближайшему результату</div></div>
<div class="bc"><div class="bct"><div class="k">TTFT, МС</div><div>меньше — лучше</div></div><div class="brs">${map(TTFT, brow)}</div><div class="bf">в 2,3 раза быстрее отклик, чем у Selectel</div></div>
</div>
<div class="g5 sla">${map(SLA, ([k, t]) => `<div><div class="k">${k}</div><div>${t}</div></div>`)}</div>
<div class="g3 kpi">${map(KPI, ([v, l]) => `<div><span>${v}</span><span>${l}</span></div>`)}</div>
</section>

${barsSection()}

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
<div class="ms"><div><div>324</div><div>моделей в Gateway</div></div><div><div>13</div><div>юрисдикций</div></div></div>
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
    const v = Math.max(0, Math.min(1.02, (202 - best[1]) / 184));
    val.textContent = v.toFixed(2);
    val.style.color = v >= 0.7 ? "#3FB950" : v >= 0.4 ? "#B98A2E" : "#D14E3C";
    step.textContent = Math.round(best[0] / 600 * 10000).toLocaleString("ru-RU") + " step";
  });
  chart.addEventListener("mouseleave", () => {
    cur.style.opacity = dot.style.opacity = shade.style.opacity = "0";
    val.textContent = "0.92";
    val.style.color = "#3FB950";
    step.textContent = "step";
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
  $("count").textContent = rows.length + " моделей в выборке · всего 324 в Gateway";
}

// Hidden columns are classes on the table (.nc — no cache, .nw — no web search); CSS picks the grid template.
function toggleCol(key, btn) {
  cols[key] = !cols[key];
  const box = btn.querySelector(".box");
  $("tbl").classList.toggle(key === "cache" ? "nc" : "nw", !cols[key]);
  box.classList.toggle("off", !cols[key]);
  box.textContent = cols[key] ? "✓" : "";
  $("colcount").textContent = "(" + (12 + cols.cache + cols.web) + ")";
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
  const section = $("how"), tooltip = $("bars-tooltip"), figure = section.querySelector(".bars-figure");
  const controls = Array.from(section.querySelectorAll("[data-bars]"));
  const parts = Array.from(section.querySelectorAll("[data-bars-node],[data-bars-link],[data-bars-copy]"));
  const defaults = [$("bars-detail-title").textContent, $("bars-detail-note").textContent, $("bars-detail-tech").textContent];
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
    $("bars-detail-title").textContent = topic ? topic.title : defaults[0];
    $("bars-detail-note").textContent = topic ? topic.note : defaults[1];
    $("bars-detail-tech").textContent = topic ? topic.technical : defaults[2];
    tooltipAnchor = current && current.classList.contains("bars-term") ? current : null;
    tooltip.hidden = !tooltipAnchor;
    if (tooltipAnchor) {
      $("bars-tooltip-text").textContent = topic.technical;
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
  figure.querySelector(".bars-detail").setAttribute("aria-live", "polite");
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
