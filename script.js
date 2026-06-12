const parseNumber = (cell) => {
  const value = Number.parseFloat(cell.textContent.trim());
  return Number.isFinite(value) ? value : null;
};

const colorMainResultsTable = () => {
  const table = document.querySelector('.main-results-table');
  if (!table) return;

  const baseline = new Map();
  let setting = '';
  let phase = 'baseline';

  const rows = Array.from(table.tBodies[0]?.rows ?? []);

  for (const row of rows) {
    if (row.classList.contains('group-row')) {
      const label = row.textContent.toLowerCase();
      phase = label.includes('protected') ? 'protected' : 'raw';
      continue;
    }

    const settingHeader = row.querySelector('th');
    if (settingHeader) setting = settingHeader.textContent.trim();

    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length < 2) continue;

    const difficulty = cells[0].textContent.trim();
    const values = cells.slice(1);

    if (setting === 'No Skills') {
      baseline.set(difficulty, values.map(parseNumber));
      continue;
    }

    if (phase !== 'raw' && phase !== 'protected') continue;

    const baseValues = baseline.get(difficulty);
    if (!baseValues) continue;

    values.forEach((cell, index) => {
      const value = parseNumber(cell);
      const base = baseValues[index];
      if (value === null || base === null || base === undefined) return;

      const delta = value - base;
      if (delta > 0.05) {
        cell.classList.add('above-baseline');
        cell.title = `${delta.toFixed(1)} above No Skills baseline`;
      } else if (delta < -0.05) {
        cell.classList.add('below-baseline');
        cell.title = `${Math.abs(delta).toFixed(1)} below No Skills baseline`;
      } else {
        cell.classList.add('equal-baseline');
        cell.title = 'Matches No Skills baseline';
      }
    });
  }
};

colorMainResultsTable();

let caseDemos = [];

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightTerms = (text, terms, className) => {
  let html = escapeHtml(text);
  const sortedTerms = [...terms]
    .filter((term) => term.length > 2)
    .sort((a, b) => b.length - a.length);

  for (const term of sortedTerms) {
    const pattern = new RegExp(escapeRegExp(escapeHtml(term)), 'gi');
    html = html.replace(pattern, (match) => `<mark class="${className}">${match}</mark>`);
  }
  return html;
};

const tokenizeWithPositions = (text) => {
  const tokens = [];
  const pattern = /\s+|[^\s]+/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    tokens.push({
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
      isSpace: /^\s+$/.test(match[0]),
      normalized: match[0].trim().toLowerCase()
    });
  }
  return tokens;
};

const tokenIndexesForPhrases = (tokens, text, phrases) => {
  const indexes = new Set();
  for (const phrase of phrases) {
    if (!phrase) continue;
    let start = text.indexOf(phrase);
    while (start !== -1) {
      const end = start + phrase.length;
      tokens.forEach((token, index) => {
        if (token.start < end && token.end > start) indexes.add(index);
      });
      start = text.indexOf(phrase, end);
    }
  }
  return indexes;
};

const renderProtectedContent = (protectedText, rewriteSpans = [], watermarkSpans = []) => {
  const tokens = tokenizeWithPositions(protectedText);
  const watermark = tokenIndexesForPhrases(
    tokens,
    protectedText,
    [
      '=== Task Start ===',
      '=== Task Done ===',
      '## Cross-Check',
      'Cross-check:',
      'failed due to environment restrictions',
      'rerunning the required commands with the needed access'
    ].concat(watermarkSpans)
  );
  const rewrite = tokenIndexesForPhrases(tokens, protectedText, rewriteSpans);
  let hasRewrite = false;
  const runs = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    let className = '';
    if (watermark.has(index)) {
      className = 'wmk-mark';
    } else if (rewrite.has(index)) {
      className = 'rewrite-mark';
      hasRewrite = true;
    }

    const previous = runs[runs.length - 1];
    if (previous && previous.className === className) {
      previous.value += token.value;
    } else {
      runs.push({ className, value: token.value });
    }
  }

  const html = runs.map((run) => {
    const escaped = escapeHtml(run.value);
    return run.className ? `<mark class="${run.className}">${escaped}</mark>` : escaped;
  }).join('');

  return { html, hasRewrite, hasWatermark: watermark.size > 0 };
};

const renderFormattedText = (text, transform) => {
  const blocks = [];
  const pattern = /```([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before.trim()) {
      blocks.push(`<div class="segment-text">${transform(before)}</div>`);
    }
    blocks.push(`<pre class="segment-code"><code>${transform(match[1].trim())}</code></pre>`);
    lastIndex = match.index + match[0].length;
  }
  const after = text.slice(lastIndex);
  if (after.trim()) {
    blocks.push(`<div class="segment-text">${transform(after)}</div>`);
  }
  return blocks.join('');
};

const splitAssistantSegments = (text) => {
  const segments = [];
  let cursor = 0;
  while (cursor < text.length) {
    const start = text.indexOf('<tool_call', cursor);
    if (start === -1) {
      const think = text.slice(cursor).trim();
      if (think) segments.push({ type: 'think', content: think });
      break;
    }

    const think = text.slice(cursor, start).trim();
    if (think) segments.push({ type: 'think', content: think });

    let end = text.indexOf(')>', start);
    if (end !== -1) {
      end += 2;
    } else {
      end = text.indexOf('>', start);
      end = end === -1 ? text.length : end + 1;
    }
    segments.push({ type: 'tool', content: text.slice(start, end).trim() });
    cursor = end;
  }
  return segments;
};

const getToolLabel = (toolCall) => {
  const body = toolCall
    .replace(/^<tool_call\s+name=/, '')
    .replace(/>$/, '')
    .trim();
  const match = body.match(/^([A-Za-z][A-Za-z0-9_-]*(?:\s+[A-Za-z][A-Za-z0-9_-]*)?)/);
  return match ? match[1] : 'Tool Call';
};

const renderToolBody = (toolCall, transform) => {
  const body = toolCall
    .replace(/^<tool_call\s+name=/, '')
    .replace(/>$/, '')
    .trim();
  return `<pre class="segment-code tool-code"><code>${transform(body)}</code></pre>`;
};

const renderAssistantSegment = (segment, index, transform, isProtected, rewriteSpans, watermarkSpans) => {
  if (segment.type === 'tool') {
    const protectedRender = isProtected
      ? renderProtectedContent(segment.content, rewriteSpans, watermarkSpans)
      : null;
    const hasRewrite = protectedRender?.hasRewrite ?? false;
    const hasWatermark = protectedRender?.hasWatermark ?? false;
    const content = isProtected
      ? renderToolBody(segment.content, () => protectedRender.html)
      : renderToolBody(segment.content, transform);
    return `
      <div class="trajectory-segment tool-segment${hasRewrite ? ' has-rewrite' : ''}${hasWatermark ? ' has-watermark' : ''}">
        <div class="segment-head">
          <span>Tool</span>
          <strong>${escapeHtml(getToolLabel(segment.content))}</strong>
          ${hasRewrite ? '<img src="assets/rewrite_icon.png" alt="Rewritten span" title="Rewritten span">' : ''}
          ${hasWatermark ? '<img src="assets/wmk_icon.png" alt="Watermark injected" title="Watermark injected">' : ''}
        </div>
        ${content}
      </div>
    `;
  }

  const protectedRender = isProtected
    ? renderProtectedContent(segment.content, rewriteSpans, watermarkSpans)
    : null;
  const hasRewrite = protectedRender?.hasRewrite ?? false;
  const hasWatermark = protectedRender?.hasWatermark ?? false;
  const content = isProtected
    ? `<div class="segment-text">${protectedRender.html}</div>`
    : renderFormattedText(segment.content, transform);

  return `
    <div class="trajectory-segment think-segment${hasRewrite ? ' has-rewrite' : ''}${hasWatermark ? ' has-watermark' : ''}">
      <div class="segment-head">
        <span>Think</span>
        <strong>Reasoning</strong>
        ${hasRewrite ? '<img src="assets/rewrite_icon.png" alt="Rewritten span" title="Rewritten span">' : ''}
        ${hasWatermark ? '<img src="assets/wmk_icon.png" alt="Watermark injected" title="Watermark injected">' : ''}
      </div>
      ${content}
    </div>
  `;
};

const cleanOutputText = (text) => text
  .replace(/^<tool_result>/, '')
  .replace(/<\/tool_result>$/, '')
  .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
  .trim();

const renderOutputSegment = (turn, index) => `
  <article class="trajectory-turn output-turn">
    <div class="turn-meta">Output ${index + 1}</div>
    <div class="trajectory-segment output-segment">
      <div class="segment-head"><span>Output</span><strong>Tool Result</strong></div>
      ${renderFormattedText(cleanOutputText(turn.content), escapeHtml)}
    </div>
  </article>
`;

const renderTrajectoryTurn = (turn, index, keyItems, isProtected) => {
  if (turn.role !== 'assistant') return renderOutputSegment(turn, index);

  const rewriteSpans = turn.rewriteSpans ?? [];
  const watermarkSpans = turn.watermarkSpans ?? [];
  const transform = isProtected
    ? (value) => renderProtectedContent(value, rewriteSpans, watermarkSpans).html
    : (value) => highlightTerms(value, keyItems, 'raw-key');
  const segments = splitAssistantSegments(turn.content);
  return `
    <article class="trajectory-turn assistant-turn">
      <div class="turn-meta">Assistant Turn ${index + 1}</div>
      ${segments.map((segment, segmentIndex) => renderAssistantSegment(
        segment,
        segmentIndex,
        transform,
        isProtected,
        rewriteSpans,
        watermarkSpans
      )).join('')}
    </article>
  `;
};

const renderTrajectory = (turns, keyItems, isProtected) => {
  return turns.map((turn, index) => renderTrajectoryTurn(
    turn,
    index,
    keyItems,
    isProtected
  )).join('');
};

const renderCaseDemo = (activeIndex = 0) => {
  const tabs = document.getElementById('case-demo-tabs');
  const root = document.getElementById('case-demo-root');
  if (!tabs || !root) return;
  if (!caseDemos.length) {
    tabs.innerHTML = '';
    root.innerHTML = '<div class="case-demo-loading">Loading trajectory demos...</div>';
    return;
  }

  const demo = caseDemos[activeIndex];
  const rawHighlightTerms = [...new Set([...(demo.keyItems ?? []), ...(demo.rawKeyHits ?? [])])];

  tabs.innerHTML = caseDemos.map((item, index) => `
    <button class="case-demo-tab${index === activeIndex ? ' is-active' : ''}" type="button" data-demo-index="${index}">
      Demo ${index + 1}
    </button>
  `).join('');

  root.innerHTML = `
    <div class="case-demo-shell">
      <div class="case-demo-hero">
        <span class="case-demo-kicker">${escapeHtml(demo.domain)} / ${escapeHtml(demo.taskId)}</span>
        <h3>${escapeHtml(demo.title)}</h3>
        <span class="watermark-type-badge">${escapeHtml(demo.watermarkType)} Watermark</span>
      </div>
      <div class="case-demo-meta">
        <article class="case-info-card">
          <h4>Task Instruction</h4>
          <p class="case-instruction">${escapeHtml(demo.instruction)}</p>
        </article>
        <article class="key-items-card">
          <h4>Key Items</h4>
          <ul class="key-items-list">${demo.keyItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </article>
      </div>
      <div class="trace-compare">
        <section class="trace-column raw-trajectory">
          <div class="trace-column-head">
            <h4>Raw Trajectory</h4>
            <span class="trace-pill raw">Key item</span>
          </div>
          <div class="trace-list">
            ${renderTrajectory(demo.raw, rawHighlightTerms, false)}
          </div>
        </section>
        <section class="trace-column protected-trajectory">
          <div class="trace-column-head">
            <h4>Protected Trajectory</h4>
            <div class="trace-legend">
              <span class="trace-pill rewrite"><img src="assets/rewrite_icon.png" alt="">Rewrite</span>
              <span class="trace-pill watermark"><img src="assets/wmk_icon.png" alt="">Watermark</span>
            </div>
          </div>
          <div class="trace-list">
            ${renderTrajectory(demo.protected, demo.keyItems, true)}
          </div>
        </section>
      </div>
    </div>
  `;

  tabs.querySelectorAll('.case-demo-tab').forEach((button) => {
    button.addEventListener('click', () => {
      renderCaseDemo(Number(button.dataset.demoIndex));
    });
  });
};

const loadCaseDemos = async () => {
  try {
    const response = await fetch('assets/demo_cases.json?v=manual-rewrite-v3-20260611', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    caseDemos = await response.json();
    renderCaseDemo();
  } catch (error) {
    const root = document.getElementById('case-demo-root');
    if (root) {
      root.innerHTML = '<div class="case-demo-loading">Trajectory demos could not be loaded.</div>';
    }
    console.error('Failed to load demo cases:', error);
  }
};

renderCaseDemo();
loadCaseDemos();
