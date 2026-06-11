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

const caseDemos = [
  {
    title: 'Earthquake Phase Association',
    domain: 'Earth, Climate & Geophysics',
    taskId: 'earthquake-phase-association',
    instruction: 'Use `/root/data/wave.mseed` and `/root/data/stations.csv` to group seismic phase picks into earthquake events. Pick P/S waves with SeisBench, associate picks with station metadata, and write `/root/results.csv` with one row per event and an ISO-format `time` column. Evaluation matches predicted event times against a human-labeled catalog within 5 seconds.',
    keyItems: [
      'seisbench',
      'GaMMA',
      'PhaseNet',
      'association',
      'BGMM',
      'picks DataFrame',
      'timestamp',
      'max_sigma11',
      'oversample_factor',
      'bfgs_bounds'
    ],
    raw: [
      "Let me start by inspecting the data and installing dependencies in parallel.\n<tool_call name=Bash(command='pip install seisbench 2>&1 | tail -5')>\n<tool_call name=Bash(command='pip install git+https://github.com/wayneweiqiang/GaMMA.git 2>&1 | tail -5')>\n<tool_call name=Bash(command='pip install pyproj 2>&1 | tail -3')>",
      "Now let me write and run the complete pipeline. I'll use PhaseNet for picking, then GaMMA for association.\n\nimport obspy\nimport seisbench.models as sbm\nfrom gamma.utils import association, estimate_eps\nfrom pyproj import Proj\n\nmodel = sbm.PhaseNet.from_pretrained('original')\npicks_list = model.classify(st, batch_size=64, P_threshold=0.3, S_threshold=0.3)\n# Convert picks to a picks DataFrame with id, timestamp, type, prob, amp.",
      "config = {\n  'use_dbscan': True,\n  'use_amplitude': True,\n  'vel': {'p': 6.0, 's': 6.0 / 1.75},\n  'min_picks_per_eq': 4,\n  'max_sigma11': 3.0,\n  'max_sigma22': 2.0,\n  'max_sigma12': 2.0,\n  'oversample_factor': 5.0,\n  'bfgs_bounds': ((x_min, x_max), (y_min, y_max), (z_min, z_max), (None, None))\n}\nevents, assignments = association(picks_df, gamma_stations, config, method='BGMM')",
      "The pipeline is complete: 227 earthquake events were identified and written to `/root/results.csv`. The trace also records PhaseNet thresholds, GaMMA settings, projected station coordinates, and clustering details."
    ],
    protected: [
      { badges: ['watermark', 'rewrite'], content: "=== Task Start ===\nI'll check the available tools, load the waveform and station data, run the picking workflow, associate detections into events, and save the result file." },
      { badges: ['rewrite'], content: "Let me start by inspecting the data and installing the needed dependencies in parallel.\n<tool_call name=Bash(command='install waveform picking package')>\n<tool_call name=Bash(command='install phase association package')>\n<tool_call name=Bash(command='install coordinate utility')>" },
      { badges: ['rewrite'], content: "Now let me write and run the complete pipeline. I'll use a pretrained phase picker for arrival detection, then an association method to group picks into events.\n<tool_call name=Write(file_path='/root/pipeline.py', content='implemented a complete workflow to load waveform and station data, prepare station coordinates, run phase picking, associate picks into events, and save the event catalog')>" },
      { badges: ['rewrite'], content: "The pipeline is complete. The protected trace preserves the audit summary: waveform data and station metadata were loaded, arrival picks were produced, events were associated, and 227 event rows were written to `/root/results.csv`.\n=== Task Done ===" }
    ]
  },
  {
    title: 'Receipt OCR Statistics',
    domain: 'Document, Media & Web Intelligence',
    taskId: 'jpg-ocr-stat',
    instruction: 'Read scanned receipt images from `/app/workspace/dataset/img`, extract each receipt date and total amount, and write `/app/workspace/stat_ocr.xlsx` with one sheet named `results` and exactly three columns: `filename`, `date`, and `total_amount`.',
    keyItems: [
      'pytesseract',
      'PIL',
      'Image.open',
      'ImageFilter',
      'ImageOps',
      'GRAND TOTAL',
      'TOTAL RM',
      'TOTAL AMOUNT',
      '--psm 6',
      'openpyxl'
    ],
    raw: [
      "22 images. Let me examine some of them with OCR to understand the receipt formats.\n\nimport pytesseract\nfrom PIL import Image\nfor f in files[:5]:\n  img = Image.open(path)\n  text = pytesseract.image_to_string(img)\n  print(text)",
      "I will create `/app/workspace/ocr_extract.py`.\n\nTOTAL_KEYWORDS_PRIORITY = [\n  r'GRAND\\s*TOTAL',\n  r'TOTAL\\s*:?\\s*RM|TOTAL\\s*RM',\n  r'TOTAL\\s*AMOUNT',\n  r'TOTAL\\s*DUE|AMOUNT\\s*DUE|BALANCE\\s*DUE|NETT\\s*TOTAL|NET\\s*TOTAL|TOTAL|AMOUNT'\n]\n\nfrom PIL import Image, ImageFilter, ImageOps\nimport openpyxl",
      "def preprocess_image(img):\n  img = img.convert('L')\n  img = ImageOps.autocontrast(img, cutoff=2)\n  img = img.filter(ImageFilter.SHARPEN)\n  return img\n\ndef ocr_image(filepath):\n  processed = preprocess_image(Image.open(filepath))\n  return pytesseract.image_to_string(processed, config='--psm 6')",
      "After inspecting problematic receipts, I rewrote the extraction logic with exclusion patterns for GST summaries, cash/change lines, and subtotals, then wrote the ordered rows into the `results` sheet with openpyxl."
    ],
    protected: [
      { badges: ['watermark', 'rewrite'], content: "=== Task Start ===\nI'll explore the receipt image directory, inspect representative OCR output, build the extraction script, and save the spreadsheet in the required schema." },
      { badges: ['rewrite'], content: "<tool_call name=Bash(command='run OCR on a first sample batch of images')>\n<tool_call name=Bash(command='run OCR on another sample batch of images')>\n<tool_call name=Bash(command='ran OCR over the remaining receipt images to inspect extracted text')>" },
      { badges: ['rewrite'], content: "<tool_call name=Write(file_path='/app/workspace/ocr_extract.py', content='implemented a receipt OCR extraction workflow with image preprocessing, total/date extraction rules, and spreadsheet output')>" },
      { badges: ['rewrite'], content: "The result file was generated at `/app/workspace/stat_ocr.xlsx` with the expected `results` sheet and ordered filename/date/total_amount rows.\n=== Task Done ===" }
    ]
  },
  {
    title: 'Lake Warming Attribution',
    domain: 'Earth, Climate & Geophysics',
    taskId: 'lake-warming-attribution',
    instruction: 'Use water temperature, climate, land-cover, and hydrology CSV files to produce `trend_result.csv` with slope and p-value, and `dominant_factor.csv` with the most important driver category and its contribution.',
    keyItems: [
      'StandardScaler',
      'LinearRegression',
      'FactorAnalyzer',
      'varimax',
      'scaler.fit_transform',
      'fa.fit',
      'fa.transform',
      'Multiply contributions by 100',
      'NetRadiation',
      'Heat'
    ],
    raw: [
      "Planning to use Sen's slope from pymannkendall if available, with fallback to scipy linregress for slope and p-value. Next I will inspect CSV columns and choose the driver variables.",
      "I am planning to merge all CSVs by Year, analyze water_temperature trends with pymannkendall, and calculate PCA-based driver contributions using climate, hydrology, and land-cover variables grouped into Heat, Flow, Wind, and Human categories.",
      "from sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LinearRegression\nfrom factor_analyzer import FactorAnalyzer\n\nscaler = StandardScaler()\nX_scaled = scaler.fit_transform(X)\nfa = FactorAnalyzer(n_factors=4, rotation='varimax')\nfa.fit(X_scaled)\nscores = fa.transform(X_scaled)\nmodel = LinearRegression()\nmodel.fit(scores, y)\ncategory_contrib_pct = {k: v * 100 for k, v in category_contrib.items()}",
      "Trend analysis and driver attribution are complete. Wrote `trend_result.csv` with slope=0.087867 and p-value=0.03434. Wrote `dominant_factor.csv`: Heat at 53.21% contribution."
    ],
    protected: [
      { badges: ['watermark', 'rewrite'], content: "=== Task Start ===\n<tool_call name=Bash(...)>" },
      { badges: ['rewrite'], content: "No additional root-level instruction file was found, so I'll proceed by inspecting the data files and selecting an appropriate trend-analysis approach, with a fallback if needed.\n<tool_call name=Bash(command='inspect the CSV files and preview their columns')>" },
      { badges: ['rewrite'], content: "<tool_call name=Bash(command='created and ran an analysis script that loads the lake datasets, performs trend analysis, estimates grouped driver contributions, and writes the required CSV outputs')>" },
      { badges: ['rewrite'], content: "Trend analysis and driver attribution are complete. The protected trace preserves the final audit values: `slope=0.087867`, `p-value=0.03434`, dominant factor `Heat`, contribution `53.21%`.\n=== Task Done ===" }
    ]
  },
  {
    title: 'Lipinski Ro5 Screening',
    domain: 'Bioinformatics & Life Sciences',
    taskId: 'medchem-ro5-pass',
    instruction: 'Read `/root/input.csv` with molecule IDs and SMILES strings, apply Lipinski Rule of Five with the `medchem` library, and write `/root/output.txt` with PASS/FAIL lines plus a total pass/fail summary.',
    keyItems: [
      'import medchem as mc',
      'mc.rules.basic_rules.rule_of_five',
      'from rdkit import Chem',
      'from rdkit.Chem import Descriptors',
      'Chem.MolFromSmiles',
      'Descriptors.MolWt',
      'Descriptors.MolLogP',
      'Descriptors.NumHDonors',
      'Descriptors.NumHAcceptors'
    ],
    raw: [
      "I confirmed the Ro5 workflow from the skill. Next I will inspect `/root/input.csv` and run a small Python script to compute MW/LogP/HBD/HBA and format the pass/fail output exactly as requested.\n\nfrom rdkit import Chem\nfrom rdkit.Chem import Descriptors\nmol = Chem.MolFromSmiles(smiles)\nmw = Descriptors.MolWt(mol)\nlogp = Descriptors.MolLogP(mol)\nhbd = Descriptors.NumHDonors(mol)\nhba = Descriptors.NumHAcceptors(mol)",
      "I will rerun using `medchem` explicitly for the Ro5 pass/fail check.\n\nimport medchem as mc\nro5_pass = mc.rules.basic_rules.rule_of_five(smiles)\nif ro5_pass and not failed:\n  lines.append(f'{mid}: PASS (MW={mw:.2f}, LogP={logp:.2f}, HBD={hbd}, HBA={hba})')",
      "Completed. I applied Ro5 using the `medchem` library and wrote `/root/output.txt`.\n\nmol001: PASS (MW=180.16, LogP=1.31, HBD=1, HBA=3)\nmol004: FAIL (LogP)\nTotal: 3 pass, 2 fail"
    ],
    protected: [
      { badges: ['rewrite'], content: "I'll process `/root/input.csv` and generate `/root/output.txt` in the exact format specified. First I will inspect the input file, then run a Python script to compute the required properties and format the pass/fail output." },
      { badges: ['rewrite'], content: "<tool_call name=python content='ran a script to read the CSV, evaluate the required criteria for each molecule, and write formatted results to /root/output.txt'>" },
      { badges: ['rewrite'], content: "<tool_call name=python content='ran an updated script using the required library for the rule check, kept criterion-specific fail labels, and rewrote /root/output.txt'>" },
      { badges: ['rewrite'], content: "Completed. The protected trace preserves the final output summary and examples while removing reusable implementation details.\n\nmol001: PASS (MW=180.16, LogP=1.31, HBD=1, HBA=3)\nmol004: FAIL (LogP)\nTotal: 3 pass, 2 fail" }
    ]
  }
];

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

const renderTraceMessage = (message, index, keyItems, isProtected) => {
  const badges = isProtected ? message.badges : [];
  const classes = ['trace-message'];
  if (badges.includes('rewrite')) classes.push('is-rewrite');
  if (badges.includes('watermark')) classes.push('is-watermark');

  const icons = badges.map((badge) => {
    const src = badge === 'watermark' ? 'assets/wmk_icon.png' : 'assets/rewrite_icon.png';
    const alt = badge === 'watermark' ? 'Watermark injected' : 'Rewritten message';
    return `<img src="${src}" alt="${alt}" title="${alt}">`;
  }).join('');

  let content = isProtected
    ? highlightTerms(message.content, ['=== Task Start ===', '=== Task Done ==='], 'wmk-mark')
    : highlightTerms(message, keyItems, 'raw-key');

  if (isProtected && badges.includes('rewrite')) {
    content = `<mark class="rewrite-mark">${content}</mark>`;
  }

  return `
    <article class="${classes.join(' ')}">
      <div class="message-meta">
        <span>Assistant Turn ${index + 1}</span>
        <span class="message-icons">${icons}</span>
      </div>
      <pre class="message-content">${content}</pre>
    </article>
  `;
};

const renderCaseDemo = (activeIndex = 0) => {
  const tabs = document.getElementById('case-demo-tabs');
  const root = document.getElementById('case-demo-root');
  if (!tabs || !root) return;

  const demo = caseDemos[activeIndex];

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
        <p>Raw trace exposes concrete reusable procedure; protected trace preserves the audit story while abstracting implementation details and provenance hooks.</p>
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
            ${demo.raw.map((message, index) => renderTraceMessage(message, index, demo.keyItems, false)).join('')}
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
            ${demo.protected.map((message, index) => renderTraceMessage(message, index, demo.keyItems, true)).join('')}
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

renderCaseDemo();
