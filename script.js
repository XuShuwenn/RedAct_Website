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
