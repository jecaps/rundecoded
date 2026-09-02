import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const budgets = new Map([
  ['.js', 600 * 1024],
  ['.css', 100 * 1024],
]);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await filesIn(path)));
    } else {
      files.push(path);
    }
  }

  return files;
}

const files = await filesIn('dist');
const totals = new Map();

for (const file of files) {
  const extension = file.slice(file.lastIndexOf('.'));
  if (!budgets.has(extension)) continue;
  totals.set(extension, (totals.get(extension) ?? 0) + (await stat(file)).size);
}

for (const [extension, budget] of budgets) {
  const total = totals.get(extension) ?? 0;
  if (total > budget) {
    throw new Error(
      `Production ${extension} budget exceeded: ${total} bytes (limit ${budget})`,
    );
  }

  console.log(
    `Production ${extension} budget: ${Math.ceil(total / 1024)} KiB / ${Math.ceil(budget / 1024)} KiB`,
  );
}
