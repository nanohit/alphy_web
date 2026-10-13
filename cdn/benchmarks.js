/* Alphy model comparison. SVG + native controls; loaded only near the viewport. */
import { BENCHMARK_DATA } from './benchmarks-data.js';

export const BENCHMARK_VIEWS = [
  { id: 'cost-quality', title: 'Стоимость и качество', tab: 'Стоимость — качество', metric: 'cost', axis: 'Стоимость задачи · ₽', scatter: true },
  { id: 'time-quality', title: 'Время и качество', tab: 'Время — качество', metric: 'time', axis: 'Время генерации задачи', scatter: true },
  { id: 'tokens-task', title: 'Токены на задачу', tab: 'Токены на задачу', metric: 'tokens', axis: 'Выходные токены на задачу', optionalScatter: true },
  { id: 'tokens-total', title: 'Общий расход токенов', tab: 'Всего токенов', metric: 'tokensTotal', axis: 'Выходные токены за весь прогон' },
  { id: 'cost-task', title: 'Стоимость задачи', tab: 'Стоимость задачи', metric: 'cost', axis: 'Стоимость задачи · ₽' },
  { id: 'cost-total', title: 'Стоимость прогона', tab: 'Стоимость прогона', metric: 'costTotal', axis: 'Стоимость всего прогона · ₽' }
];
const EFFORTS = { none: 'Без рассуждения', low: 'Низкий', medium: 'Средний', high: 'Высокий', xhigh: 'Очень высокий', max: 'Максимальный', default: 'По умолчанию' };
const TITLE = 'Стоимость и качество под ваши задачи, через API Alphy.';
// Slopalytics' dark-theme family colors; symbols distinguish nearby shades.
const MODEL_STYLES = {
  'claude-opus-5.5': ['#df9477', 'Opus'], 'claude-sonnet-5.5': ['#f0b99f', 'Sonnet'],
  'claude-fable-5.1': ['#cc785c', 'Fable'], 'claude-haiku-5.5': ['#b98a74', 'Haiku'],
  'gpt-6.1-sol': ['#c5cbd3', 'Sol'], 'gpt-6-astra': ['#f1f3f5', 'Astra'],
  'gpt-6-luna': ['#939daa', 'Luna'], 'gemini-4-argon': ['#56ca80', 'Argon'],
  'grok-4.7': ['#9b94ee', 'Grok'], 'muse-wonder': ['#94c4ff', 'Muse'],
  'mistral-large-4': ['#ff8b45', 'Mistral']
};
const LAB_NAMES = { google: 'Google', openai: 'OpenAI', anthropic: 'Anthropic', xai: 'xAI' };
const labLogo = lab => LAB_NAMES[lab] ? `<img class="bench-lab-logo" src="${new URL('./logos/' + lab + '.svg', import.meta.url)}" alt="${LAB_NAMES[lab]}" width="16" height="16" loading="lazy">` : '';
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
const money = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compact = value => value >= 1e6 ? number.format(value / 1e6) + ' млн' : value >= 1e3 ? number.format(value / 1e3) + ' тыс.' : number.format(value);
const moneyText = value => value == null ? '—' : money.format(value) + ' ₽';
const timeText = value => {
  if (value == null) return '—';
  const seconds = Math.round(value);
  return value < 60 ? number.format(value) + ' с' : Math.floor(seconds / 60) + ' мин ' + seconds % 60 + ' с';
};
const rate = value => { const match = value && value.match(/\$([\d.]+)\s*\/\s*M\b/); return match ? Number(match[1]) : null; };

// Profiles are measured cost components divided by the source's corresponding
// token rate (millions of equivalent tokens). Reprice each component separately.
export function benchmarkCost(profile, catalogModel, convert) {
  if (!profile || !catalogModel) return null;
  const input = rate(catalogModel.input), output = rate(catalogModel.output);
  if (input == null || output == null) return null;
  const read = rate(catalogModel.cacheRead) ?? input;
  const write = rate(catalogModel.cacheWrite) ?? input;
  return convert(profile.input * input + profile.output * output + profile.cacheRead * read + profile.cacheWrite * write);
}

export function benchmarkPareto(points, metric) {
  let best = -Infinity;
  return points.filter(p => p[metric] != null && p[metric] > 0).sort((a, b) => a[metric] - b[metric] || b.intelligence - a.intelligence)
    .filter(point => { if (point.intelligence <= best) return false; best = point.intelligence; return true; });
}

function linearDomain(max, count = 5) {
  const raw = Math.max(max, 1e-8) / count, power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power, step = (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * power;
  const end = Math.ceil(max / step) * step || 1;
  return { min: 0, max: end, ticks: Array.from({ length: Math.round(end / step) + 1 }, (_, i) => i * step) };
}
function logDomain(values, width) {
  const min = 10 ** Math.floor(Math.log10(Math.min(...values))), upper = 10 ** Math.ceil(Math.log10(Math.max(...values)));
  const max = upper === min ? min * 10 : upper;
  const ticks = [];
  for (let power = Math.log10(min); power <= Math.log10(max); power++) {
    for (const factor of [1, 2, 5]) { const value = factor * 10 ** power; if (value >= min && value <= max) ticks.push(value); }
  }
  const position = value => width * Math.log(value / min) / Math.log(max / min);
  const spaced = [min], gap = 85;
  ticks.forEach(value => {
    const x = position(value);
    if (value !== min && value !== max && x - position(spaced.at(-1)) >= gap && width - x >= gap) spaced.push(value);
  });
  spaced.push(max);
  return { min, max, ticks: spaced };
}
const symbol = (index, size = 4) => {
  const s = size;
  switch (index % 8) {
    case 1: return `<rect class="bench-symbol" x="${-s}" y="${-s}" width="${s * 2}" height="${s * 2}"/>`;
    case 2: return `<path class="bench-symbol" d="M0 ${-s-1}L${s+1} 0L0 ${s+1}L${-s-1} 0Z"/>`;
    case 3: return `<path class="bench-symbol" d="M0 ${-s-1}L${s+1} ${s}L${-s-1} ${s}Z"/>`;
    case 4: return `<path class="bench-symbol bench-open" d="M${-s-1} 0H${s+1}M0 ${-s-1}V${s+1}"/>`;
    case 5: return `<path class="bench-symbol bench-open" d="M${-s} ${-s}L${s} ${s}M${-s} ${s}L${s} ${-s}"/>`;
    case 6: return `<circle class="bench-symbol bench-filled" r="${s}"/>`;
    case 7: return `<rect class="bench-symbol bench-filled" x="${-s}" y="${-s}" width="${s*2}" height="${s*2}"/>`;
    default: return `<circle class="bench-symbol" r="${s}"/>`;
  }
};

export function mountBenchmarks(section, options) {
  const models = [...new Set(BENCHMARK_DATA.points.map(p => p.model))].map((id, i) => {
    const [lab, slug] = id.split('/'), [color, short] = MODEL_STYLES[slug] || ['#a4adb9', slug];
    return { id, index: i, lab, color, short, name: BENCHMARK_DATA.points.find(p => p.model === id).name,
      fallback: BENCHMARK_DATA.points.some(p => p.model === id && p.fallback) };
  });
  const state = { view: BENCHMARK_VIEWS[0], scale: 'log', type: 'bars', pareto: false, effort: 'all', models: new Set(models.map(m => m.id)), pinned: null, highlighted: null };
  let points = [], layouts = [], width = 0, svg = null, current = null, now = new Date(), disposed = false, pointerType = 'mouse';
  let cachedCatalog = options.getCatalog(now);
  const priced = () => BENCHMARK_DATA.points.map(p => {
    const model = cachedCatalog.find(m => m.name === p.model);
    return { ...p, cost: benchmarkCost(p.taskProfile, model, options.rubleAmount), costTotal: benchmarkCost(p.totalProfile, model, options.rubleAmount), catalog: model };
  });
  const isScatter = () => state.view.scatter || state.view.optionalScatter && state.type === 'scatter';
  const metricText = (metric, value, axis = false) => value == null ? '—' : metric === 'cost' || metric === 'costTotal' ? (axis ? compact(value) : money.format(value)) + ' ₽'
    : metric === 'time' ? timeText(value) : compact(value);
  const openingDate = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
  section.innerHTML = `<div class="bench-heading"><h2 id="model-benchmarks-title">${TITLE}</h2><span class="bench-price-label" title="${escape(options.priceNote)}">Цены API Alphy · ₽</span></div>
<div class="bench-frame">
<div class="bench-tabs" role="tablist" aria-label="Показатель сравнения">${BENCHMARK_VIEWS.map((view, i) => `<button type="button" role="tab" id="bench-tab-${view.id}" data-bench-view="${view.id}" aria-controls="bench-panel" aria-selected="${!i}" tabindex="${i ? -1 : 0}">${view.tab}</button>`).join('')}</div>
<div class="bench-body">
<div class="bench-main" id="bench-panel" role="tabpanel" aria-labelledby="bench-tab-${state.view.id}">
<div class="bench-tools"><span class="bench-axis-heading"></span><div class="bench-tools-right">
<button type="button" class="bench-pareto" aria-pressed="false" title="Модели, для которых нет более дешёвого или быстрого варианта с таким же или более высоким качеством">Граница эффективности</button>
<div class="bench-type seg" role="group" aria-label="Вид графика"><button type="button" data-bench-type="bars" aria-pressed="true">Столбцы</button><button type="button" data-bench-type="scatter" aria-pressed="false">Точки</button></div>
<div class="bench-scale seg" role="group" aria-label="Шкала графика"><button type="button" data-bench-scale="linear" aria-pressed="false">Линейная</button><button type="button" data-bench-scale="log" aria-pressed="true">Логарифмическая</button></div>
</div></div>
<div class="bench-plot"><div class="bench-svg"></div><div class="bench-tooltip" role="tooltip" hidden></div></div>
<div class="bench-axis-bottom"></div>
</div>
<aside class="bench-models" aria-label="Выбор моделей"><div class="bench-models-heading"><span>Модели</span><button type="button" class="bench-select-all">Все</button></div>
<label class="bench-effort-label" for="bench-effort">Уровень рассуждения</label><select id="bench-effort"><option value="all">Все уровни</option>${Object.entries(EFFORTS).filter(([key]) => BENCHMARK_DATA.points.some(point => point.effort === key)).map(([key,label]) => `<option value="${key}">${label}</option>`).join('')}</select>
<div class="bench-model-list">${models.map(m => `<button type="button" data-bench-model="${m.id}" aria-pressed="true" style="--model-color:${m.color}"><svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true" style="color:${m.color}">${symbol(m.index, 3)}</svg><span>${escape(m.name.replace('Claude ', ''))}${m.fallback ? '<small title="Замер Artificial Analysis в режиме default fallback"> · fallback</small>' : ''}</span>${labLogo(m.lab)}</button>`).join('')}</div>
</aside>
</div>
<div class="bench-footer"><span>Оценки, токены, время — <a href="${BENCHMARK_DATA.methodology}" target="_blank" rel="noreferrer" title="Снимок результатов: ${BENCHMARK_DATA.date.split('-').reverse().join('.')}">Artificial Analysis</a> · <time title="Дата просмотра">${openingDate}</time></span><span title="${escape(options.priceNote)}">Расчёт по ценам API Alphy</span></div>
</div>`;
  const panel = section.querySelector('#bench-panel'), plot = section.querySelector('.bench-plot');
  const svgContainer = section.querySelector('.bench-svg'), tip = section.querySelector('.bench-tooltip');
  const bottom = section.querySelector('.bench-axis-bottom'), heading = section.querySelector('.bench-axis-heading');
  const scaleControl = section.querySelector('.bench-scale'), typeControl = section.querySelector('.bench-type'), paretoControl = section.querySelector('.bench-pareto');
  const tabs = [...section.querySelectorAll('[data-bench-view]')];
  const setHighlight = model => {
    if (state.highlighted === model) return;
    state.highlighted = model;
    section.querySelectorAll('[data-bench-series]').forEach(group => group.classList.toggle('is-dim', !!model && group.dataset.benchSeries !== model));
    section.querySelectorAll('[data-bench-model]').forEach(button => button.classList.toggle('is-highlighted', button.dataset.benchModel === model));
  };
  const hideTip = () => {
    if (current) current.setAttribute('data-active', 'false');
    current = null;
    tip.hidden = true;
    tip.classList.remove('is-pinned');
    svg?.querySelector('.bench-crosshair')?.setAttribute('visibility', 'hidden');
    setHighlight(null);
  };
  const unpin = () => {
    if (state.pinned) svg?.querySelector(`[data-point="${state.pinned}"]`)?.setAttribute('aria-pressed', 'false');
    state.pinned = null;
  };
  const tooltipRows = point => {
    const metrics = [['intelligence', 'Индекс качества'], [state.view.metric, state.view.axis.replace(' · ₽', '')], ['cost', 'Стоимость задачи'], ['tokens', 'Токены на задачу'], ['time', 'Время генерации']];
    const seen = new Set();
    return metrics.filter(([key]) => !seen.has(key) && seen.add(key)).map(([key,label]) => `<div><span>${label}</span><strong>${key === 'intelligence' ? number.format(point.intelligence) : metricText(key,point[key])}</strong></div>`).join('');
  };
  const showPoint = id => {
    const point = points.find(p => p.id === id), layout = layouts.find(p => p.id === id);
    if (!point || !layout) return;
    if (current) current.setAttribute('data-active', 'false');
    current = svg.querySelector(`[data-point="${id}"]`);
    current.setAttribute('data-active', 'true');
    tip.classList.toggle('is-pinned', !!state.pinned);
    tip.innerHTML = `<div class="bench-tip-heading"><div><strong>${escape(point.name)}</strong><span>${EFFORTS[point.effort] || 'По умолчанию'}${point.fallback ? ' · default fallback' : ''}</span></div>${state.pinned ? '<button type="button" aria-label="Закрыть информацию о модели">×</button>' : ''}</div>${tooltipRows(point)}<div class="bench-tip-price">Цены API Alphy</div>`;
    tip.hidden = false;
    // Hover details never intercept the mouse; keep them in the opposite corner.
    const x = layout.x < width / 2 ? width - tip.offsetWidth - 10 : 10;
    const y = layout.y < plot.clientHeight / 2 ? plot.clientHeight - tip.offsetHeight - 10 : 10;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
    const cross = svg.querySelector('.bench-crosshair');
    if (cross && isScatter()) {
      cross.setAttribute('d', `M${layout.x} 26V${plot.clientHeight-32}M${plot.dataset.left} ${layout.y}H${width-20}`);
      cross.setAttribute('visibility', 'visible');
    }
    setHighlight(point.model);
  };
  const render = () => {
    if (disposed || !width) return;
    unpin(); hideTip();
    const context = priced().filter(p => state.models.has(p.model) && p[state.view.metric] != null);
    points = context.filter(p => state.effort === 'all' || p.effort === state.effort);
    const scatter = isScatter(), mobile = width < 580, horizontal = !scatter && mobile;
    const groups = models.filter(m => points.some(p => p.model === m.id));
    const height = horizontal ? Math.max(250, groups.length * 38 + 52) : mobile ? 330 : 410;
    const margin = { left: scatter ? 38 : mobile ? 67 : 80, right: mobile ? 14 : 22, top: 24, bottom: scatter ? 36 : horizontal ? 28 : 50 };
    const chartWidth = width-margin.left-margin.right, chartHeight = height-margin.top-margin.bottom;
    plot.dataset.left = margin.left; plot.style.height = height + 'px';
    panel.setAttribute('aria-labelledby', 'bench-tab-' + state.view.id);
    heading.textContent = scatter ? 'Индекс качества' : state.view.axis;
    bottom.textContent = scatter || horizontal ? state.view.axis : 'Модели';
    bottom.title = scatter && state.view.metric === 'time' ? 'Среднее время генерации в исходном замере, без TTFT и сетевых задержек. Это метрика Artificial Analysis.' : '';
    scaleControl.hidden = !scatter; typeControl.hidden = !state.view.optionalScatter; paretoControl.hidden = !scatter;
    tabs.forEach(tab => { const on = tab.dataset.benchView === state.view.id; tab.setAttribute('aria-selected', on); tab.tabIndex = on ? 0 : -1; });
    section.querySelectorAll('[data-bench-scale]').forEach(button => { const on = button.dataset.benchScale === state.scale; button.classList.toggle('on', on); button.setAttribute('aria-pressed', on); });
    section.querySelectorAll('[data-bench-type]').forEach(button => { const on = button.dataset.benchType === state.type; button.classList.toggle('on', on); button.setAttribute('aria-pressed', on); });
    paretoControl.setAttribute('aria-pressed', state.pareto);
    section.querySelectorAll('[data-bench-model]').forEach(button => button.setAttribute('aria-pressed', state.models.has(button.dataset.benchModel)));
    if (!points.length) {
      layouts = []; svg = null;
      svgContainer.innerHTML = `<p class="bench-empty">${state.models.size ? 'Для этого показателя и уровня нет данных.' : 'Выберите модель для сравнения.'}</p>`;
      return;
    }
    let axes = '', grid = '', series = '', frontier = '', shade = '';
    layouts = [];
    const formatAxis = value => state.view.metric === 'time'
      ? number.format(value < 60 ? value : value / 60) + (value < 60 ? ' с' : ' мин')
      : !scatter && (state.view.metric === 'cost' || state.view.metric === 'costTotal')
        ? compact(value) : metricText(state.view.metric, value, true);
    const efficient = scatter && state.pareto ? benchmarkPareto(points, state.view.metric) : [];
    const efficientIds = new Set(efficient.map(p => p.id));
    const pointMarkup = (p, x, y, shape) => {
      layouts.push({id:p.id,x,y});
      const label = `${p.name}, ${EFFORTS[p.effort] || 'По умолчанию'}${p.fallback ? ', default fallback' : ''}, ${state.view.axis}: ${metricText(state.view.metric,p[state.view.metric])}, индекс качества ${number.format(p.intelligence)}`;
      return `<g class="bench-point${scatter && state.pareto && !efficientIds.has(p.id) ? ' is-dominated' : ''}" data-point="${p.id}" role="button" tabindex="${layouts.length === 1 ? 0 : -1}" aria-label="${escape(label)}" aria-pressed="false" transform="translate(${x} ${y})">${shape}</g>`;
    };
    if (scatter) {
      // Keep each model's full reasoning trajectory and stable axes when filtering levels.
      const visibleContext = context.filter(p => groups.some(m => m.id === p.model));
      const values = visibleContext.map(p=>p[state.view.metric]).filter(v=>v>0);
      const domain = state.scale === 'log' ? logDomain(values, chartWidth) : linearDomain(Math.max(...values),Math.max(3,Math.floor(chartWidth/120)));
      const coordinate = value => margin.left + chartWidth * (state.scale === 'log' ? Math.log(value/domain.min)/Math.log(domain.max/domain.min) : value/domain.max);
      const minY = Math.max(0, Math.floor(Math.min(...visibleContext.map(p=>p.intelligence))/10)*10-10), maxY = Math.ceil(Math.max(...visibleContext.map(p=>p.intelligence))/10)*10;
      const yCoordinate = value => margin.top + chartHeight * (1-(value-minY)/(maxY-minY));
      for (let value=minY;value<=maxY;value+=10) {
        const y = yCoordinate(value);
        grid += `<path d="M${margin.left} ${y}H${width-margin.right}"/>`;
        axes += `<text x="${margin.left-10}" y="${y+4}" text-anchor="end">${value}</text>`;
      }
      domain.ticks.forEach(value => {
        const x = coordinate(value);
        grid += `<path d="M${x} ${margin.top}V${height-margin.bottom}"/>`;
        axes += `<text x="${x}" y="${height-12}" text-anchor="${x>width-60?'end':x<60?'start':'middle'}">${escape(formatAxis(value))}</text>`;
      });
      groups.forEach(model => {
        const group = points.filter(p=>p.model===model.id).sort((a,b)=>a.effortOrder-b.effortOrder);
        const trajectory = visibleContext.filter(p=>p.model===model.id).sort((a,b)=>a.effortOrder-b.effortOrder);
        const lines = trajectory.slice(1).map((p,i) => `<path class="bench-line${state.effort !== 'all' ? ' is-context' : ''}${state.pareto && (!efficientIds.has(p.id) || !efficientIds.has(trajectory[i].id)) ? ' is-dominated' : ''}" d="M${coordinate(trajectory[i][state.view.metric])} ${yCoordinate(trajectory[i].intelligence)}L${coordinate(p[state.view.metric])} ${yCoordinate(p.intelligence)}"/>`).join('');
        series += `<g data-bench-series="${model.id}" style="color:${model.color}">${lines}${group.map(p=>pointMarkup(p,coordinate(p[state.view.metric]),yCoordinate(p.intelligence),`<circle class="bench-hit" r="11"/>${symbol(model.index)}`)).join('')}</g>`;
      });
      if (efficient.length) {
        // A step frontier shades precisely the dominated region, including equal-quality, dearer points.
        const path = efficient.map((p,i)=>(i?'H':'M')+coordinate(p[state.view.metric])+(i?'V':' ')+yCoordinate(p.intelligence)).join(' ') + `H${width-margin.right}`;
        frontier = `<path class="bench-frontier" d="${path}"/>`;
        shade = `<path class="bench-dominated-area" d="M${coordinate(efficient[0][state.view.metric])} ${height-margin.bottom}L${path.slice(1)}V${height-margin.bottom}Z" aria-hidden="true"/>`;
      }
    } else {
      const domain = linearDomain(Math.max(...points.map(p=>p[state.view.metric])), horizontal ? 2 : 4);
      domain.ticks.forEach(value => {
        if (horizontal) {
          const x = margin.left + chartWidth*value/domain.max;
          grid += `<path d="M${x} ${margin.top}V${height-margin.bottom}"/>`;
          axes += `<text x="${x}" y="${height-9}" text-anchor="${value===0?'start':value===domain.max?'end':'middle'}">${escape(formatAxis(value))}</text>`;
        } else {
          const y = margin.top + chartHeight*(1-value/domain.max);
          grid += `<path d="M${margin.left} ${y}H${width-margin.right}"/>`;
          axes += `<text x="${margin.left-10}" y="${y+4}" text-anchor="end">${escape(formatAxis(value))}</text>`;
        }
      });
      const groupSize = (horizontal ? chartHeight : chartWidth)/groups.length;
      groups.forEach((model, i) => {
        const group = points.filter(p=>p.model===model.id).sort((a,b)=>a.effortOrder-b.effortOrder);
        const slot = (groupSize-Math.min(16,groupSize*.2))/group.length, barSize=Math.max(2,slot*.75);
        const content = group.map((p,j)=> {
          const offset = i*groupSize+(groupSize-slot*group.length)/2+slot*(j+.5);
          const length = (horizontal ? chartWidth : chartHeight)*p[state.view.metric]/domain.max;
          const x = horizontal ? margin.left+length : margin.left+offset;
          const y = horizontal ? margin.top+offset : margin.top+chartHeight-length;
          const hit = horizontal ? `x="${-length}" y="${-Math.max(5,barSize)/2}" width="${length+4}" height="${Math.max(5,barSize)}"` : `x="${-Math.max(10,barSize)/2}" y="-4" width="${Math.max(10,barSize)}" height="${length+8}"`;
          const bar = horizontal ? `x="${-length}" y="${-barSize/2}" width="${length}" height="${barSize}"` : `x="${-barSize/2}" width="${barSize}" height="${length}"`;
          return pointMarkup(p,x,y,`<rect class="bench-hit" ${hit}/><rect class="bench-bar" ${bar} style="fill-opacity:${.5+j*.5/Math.max(1,group.length-1)}"/>`);
        }).join('');
        series += `<g data-bench-series="${model.id}" style="color:${model.color}">${content}</g>`;
        if (horizontal) {
          axes += `<text class="bench-model-axis" x="${margin.left-10}" y="${margin.top+(i+.5)*groupSize+4}" text-anchor="end" style="fill:${model.color}">${escape(model.short)}</text>`;
        } else {
          const label = groupSize < 100 ? model.short : model.name.replace('Claude ','');
          const words = label.split(' '), half = words.length>2?Math.ceil(words.length/2):words.length;
          axes += `<text class="bench-model-axis" x="${margin.left+(i+.5)*groupSize}" y="${height-margin.bottom+19}" text-anchor="middle" style="fill:${model.color}"><tspan x="${margin.left+(i+.5)*groupSize}">${escape(words.slice(0,half).join(' '))}</tspan>${half<words.length?`<tspan x="${margin.left+(i+.5)*groupSize}" dy="15">${escape(words.slice(half).join(' '))}</tspan>`:''}</text>`;
        }
      });
    }
    svgContainer.innerHTML = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="group" aria-label="${escape(state.view.title)}"><g class="bench-grid" aria-hidden="true">${grid}</g>${shade}<g class="bench-axis" aria-hidden="true">${axes}</g><path class="bench-crosshair" visibility="hidden" aria-hidden="true"/>${series}${frontier}</svg>`;
    svg = svgContainer.querySelector('svg');
  };
  const nearestPoint = event => {
    const direct = event.target.closest?.('[data-point]');
    if (direct) return direct.dataset.point;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect(), x = event.clientX-rect.left, y=event.clientY-rect.top;
    let distance=32*32, nearest=null;
    layouts.forEach(point => { const d=(point.x-x)**2+(point.y-y)**2; if(d<distance){distance=d;nearest=point.id;} });
    return nearest;
  };
  plot.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    if (state.pinned) { unpin(); hideTip(); }
    const id = nearestPoint(event);
    if (id && current?.dataset.point !== id) showPoint(id);
    else if (!id) hideTip();
  });
  plot.addEventListener('pointerleave', () => { if (!state.pinned) hideTip(); });
  plot.addEventListener('pointerdown', event => { pointerType = event.pointerType || 'mouse'; });
  plot.addEventListener('click', event => {
    if (tip.contains(event.target)) return;
    const id=nearestPoint(event);
    if (!id) {unpin();hideTip();return;}
    // Only touch and explicit keyboard activation pin details. Desktop clicks stay transient.
    if(event.pointerType==='touch' || !event.pointerType && pointerType==='touch' || event.detail===0){
      if(state.pinned===id){unpin();hideTip();return;}
      unpin();state.pinned=id;showPoint(id);current.setAttribute('aria-pressed','true');
    } else { unpin();showPoint(id); }
  });
  plot.addEventListener('focusin',event => { const point=event.target.closest('[data-point]');if(point)showPoint(point.dataset.point); });
  plot.addEventListener('focusout',event => {if(!state.pinned && !plot.contains(event.relatedTarget))hideTip();});
  plot.addEventListener('keydown', event => {
    const node=event.target.closest('[data-point]');if(!node)return;
    if(event.key==='Enter'||event.key===' '){event.preventDefault();node.dispatchEvent(new MouseEvent('click',{bubbles:true}));return;}
    const i=layouts.findIndex(p=>p.id===node.dataset.point);
    let next=i;
    if(event.key==='ArrowRight'||event.key==='ArrowDown')next=Math.min(layouts.length-1,i+1);
    else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=Math.max(0,i-1);
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=layouts.length-1;
    else return;
    event.preventDefault();unpin();node.setAttribute('tabindex','-1');
    const target=svg.querySelector(`[data-point="${layouts[next].id}"]`);target.setAttribute('tabindex','0');target.focus();
  });
  tip.addEventListener('click',event => {if(event.target.closest('button')){unpin();hideTip();}});
  tabs.forEach((tab,index) => {
    tab.addEventListener('click',()=>{state.view=BENCHMARK_VIEWS[index];render();});
    tab.addEventListener('keydown',event=>{
      let next=index;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();tabs[next].click();tabs[next].focus();
    });
  });
  section.querySelectorAll('[data-bench-model]').forEach(button => {
    button.addEventListener('click',()=>{const id=button.dataset.benchModel;state.models.has(id)?state.models.delete(id):state.models.add(id);render();});
    button.addEventListener('pointerenter',()=>{if(!state.pinned)setHighlight(button.dataset.benchModel);});
    button.addEventListener('pointerleave',()=>{if(!state.pinned)setHighlight(null);});
  });
  section.querySelector('.bench-select-all').addEventListener('click',()=>{state.models=new Set(models.map(m=>m.id));state.effort='all';section.querySelector('#bench-effort').value='all';render();});
  section.querySelector('#bench-effort').addEventListener('change',event=>{state.effort=event.target.value;render();});
  section.querySelectorAll('[data-bench-scale]').forEach(button=>button.addEventListener('click',()=>{state.scale=button.dataset.benchScale;render();}));
  section.querySelectorAll('[data-bench-type]').forEach(button=>button.addEventListener('click',()=>{state.type=button.dataset.benchType;render();}));
  paretoControl.addEventListener('click',()=>{state.pareto=!state.pareto;render();});
  const outside = event => {if(!plot.contains(event.target)){unpin();hideTip();}};
  const escapeKey = event => {if(event.key==='Escape'){unpin();hideTip();}};
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escapeKey);
  const resize = new ResizeObserver(entries => {
    const next=Math.round(entries[0].contentRect.width);
    if(next!==width){width=next;render();}
  });
  resize.observe(svgContainer);
  const pagehide = event => {
    if(event.persisted)return;
    disposed=true;resize.disconnect();
    document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escapeKey);
    removeEventListener('pagehide',pagehide);
  };
  addEventListener('pagehide',pagehide);
  return date => { now=date||new Date();cachedCatalog=options.getCatalog(now);render(); };
}
