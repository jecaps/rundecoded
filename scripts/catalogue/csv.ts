export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];

    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('CSV ended inside a quoted field');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function csvRecords(input: string): Record<string, string>[] {
  const [headers, ...rows] = parseCsv(input);
  if (!headers) return [];

  return rows.map((row, rowIndex) => {
    if (row.length !== headers.length) {
      throw new Error(
        `CSV row ${rowIndex + 2} contains ${row.length} columns; expected ${headers.length}`,
      );
    }
    return Object.fromEntries(
      headers.map((header, index) => [header, row[index] ?? '']),
    );
  });
}
