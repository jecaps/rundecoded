import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const shouldAssertVisualSnapshots = !process.env.CI;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('rundecoded-theme', 'light');
    localStorage.setItem('rundecoded-locale', 'en');
  });
  await page.goto('./en/catalogue/');
  await expect(page.getByTestId('product-explorer')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
});

test('opens details from every card entry point and restores focus', async ({
  page,
}) => {
  const card = page.getByTestId('product-card').first();
  const image = card.getByRole('button', {
    name: 'Open details for Adistar 5',
  });
  const title = page.getByRole('button', { name: 'Adistar 5', exact: true });
  const detailsButton = card.getByRole('button', {
    name: 'Details',
    exact: true,
  });
  const dialog = page.getByRole('dialog');

  for (const opener of [image, title, detailsButton]) {
    await opener.click();
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('heading', { name: 'Adistar 5' }),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  }

  await title.click();
  await expect(
    dialog.getByRole('heading', { name: 'Adistar 5' }),
  ).toBeVisible();
  await expect(dialog).toContainText('Construction & technologies');
  await expect(dialog).not.toContainText(/price|€/i);
});

test('opens comparison after selecting two product cards', async ({ page }) => {
  const cards = page.getByTestId('product-card');
  await cards.nth(0).getByRole('button', { name: 'Compare' }).click();
  await cards.nth(1).getByRole('button', { name: 'Compare' }).click();
  const compareSelected = page.getByRole('button', {
    name: 'Compare selected (2/2)',
  });
  await compareSelected.click();

  const comparison = page.getByRole('dialog');
  await expect(
    comparison.getByRole('heading', { name: 'Shoe comparison' }),
  ).toBeVisible();
  await expect(comparison).toContainText('Adistar 5');
  await expect(comparison).toContainText('Adizero Agravic Speed 2');
  await expect(comparison).toContainText('Key differences');
  await expect(comparison).toContainText('drop');
  if (shouldAssertVisualSnapshots) {
    await expect(comparison).toHaveScreenshot('catalogue-comparison.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.05,
    });
  }
  await comparison.getByRole('button', { name: 'Close' }).click();
  await expect(compareSelected).toBeFocused();
});

test('opens comparison from a comparable product and includes the detail product', async ({
  page,
}) => {
  await page.getByLabel('Search products').fill('Jogflow 100.1');
  await page
    .getByRole('button', { name: 'Jogflow 100.1', exact: true })
    .click();
  const details = page.getByRole('dialog');
  await details
    .getByRole('button', { name: 'Compare with Jogflow 190 Premium' })
    .click();

  const comparison = page.getByRole('dialog');
  await expect(
    comparison.getByRole('heading', { name: 'Shoe comparison' }),
  ).toBeVisible();
  await expect(comparison).toContainText('Jogflow 100.1');
  await expect(comparison).toContainText('Jogflow 190 Premium');
  await expect(comparison).toContainText('Key differences');
  await expect(
    comparison.locator('[data-comparison-row="weight"]'),
  ).toHaveAttribute('data-difference', 'not-compared');
  await expect(comparison).not.toContainText(/price|€/i);
});

test('search and filters produce accurate counts and an honest empty state', async ({
  page,
}) => {
  await page.getByLabel('Search products').fill('Kayano');
  await expect(page.getByTestId('product-card')).toHaveCount(2);
  await expect(page.getByText('2 of 106 shoes')).toBeVisible();

  await page.getByLabel('Search products').fill('not-a-running-shoe');
  await expect(page.getByText('No shoes match these filters.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).last().click();
  await expect(page.getByTestId('product-card')).toHaveCount(12);

  const trailFilter = page.getByRole('button', {
    name: 'Trail',
    exact: true,
  });
  await expect(trailFilter).toContainText('32');
  await trailFilter.click();
  await expect(page.getByTestId('product-card')).toHaveCount(12);
  await expect(page.getByText('32 of 106 shoes')).toBeVisible();
});

test('provides typo-tolerant keyboard suggestions and an honest fallback', async ({
  page,
}) => {
  const search = page.getByLabel('Search products');
  await search.fill('kayno');
  const suggestions = page.getByRole('listbox', { name: 'Search suggestions' });
  await expect(suggestions).toBeVisible();
  await expect(
    suggestions.getByRole('option', { name: /Gel Kayano 32/ }),
  ).toBeVisible();
  await search.evaluate((element) => {
    element.scrollIntoView({ block: 'center' });
  });
  if (shouldAssertVisualSnapshots) {
    await expect(page).toHaveScreenshot('catalogue-suggestions.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.05,
    });
  }
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(search).toHaveValue('Gel Kayano 32');
  await expect(page.getByTestId('product-card')).toHaveCount(1);
  await expect(page).toHaveURL(/q=Gel\+Kayano\+32/);

  await search.fill('zzqxvnotashoe');
  await expect(page.getByText('No shoes match these filters.')).toBeVisible();
  await expect(
    page.getByRole('link', {
      name: 'Search Decathlon for “zzqxvnotashoe”',
    }),
  ).toHaveAttribute('href', /decathlon\.co\.uk/);
  await expect(suggestions).toBeHidden();
});

test('restores shareable filter state on reload and browser history', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.getByRole('button', { name: 'Trail', exact: true }).click();
  await expect(page).toHaveURL(/category=trail/);
  await expect(page.getByTestId('product-card')).toHaveCount(12);

  await page.reload();
  await expect(page.getByTestId('product-explorer')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
  await expect(
    page.getByRole('button', { name: 'Trail', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('product-card')).toHaveCount(12);

  await page
    .getByRole('button', { name: 'All categories', exact: true })
    .click();
  await expect(page).not.toHaveURL(/category=/);
  await page.goBack();
  await expect(page).toHaveURL(/category=trail/);
  await expect(page.getByTestId('product-card')).toHaveCount(12);
  expect(consoleErrors.join('\n')).not.toMatch(/hydration|didn't match/i);
});

test('changes result pages horizontally without moving the viewport', async ({
  page,
}) => {
  const pagination = page.getByRole('navigation', { name: 'Pagination' });
  await pagination.evaluate((element) => {
    document.documentElement.style.scrollBehavior = 'auto';
    element.scrollIntoView({ block: 'center' });
  });
  const initialScrollY = await page.evaluate(() => window.scrollY);
  const initialCardHeights = await page
    .getByTestId('product-card')
    .evaluateAll((cards) =>
      cards.map((card) => Math.round(card.getBoundingClientRect().height)),
    );
  expect(new Set(initialCardHeights).size).toBe(1);

  await pagination
    .getByRole('button', { name: 'Next' })
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(page.getByTestId('product-page')).toHaveAttribute(
    'data-page-direction',
    'forward',
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const forwardScrollY = await page.evaluate(() => window.scrollY);
  const forwardCardHeights = await page
    .getByTestId('product-card')
    .evaluateAll((cards) =>
      cards.map((card) => Math.round(card.getBoundingClientRect().height)),
    );
  expect(new Set(forwardCardHeights).size).toBe(1);
  expect(forwardCardHeights[0]).toBe(initialCardHeights[0]);
  expect(forwardScrollY).toBeGreaterThan(500);
  expect(Math.abs(forwardScrollY - initialScrollY)).toBeLessThanOrEqual(32);

  await pagination
    .getByRole('button', { name: 'Previous' })
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(page).not.toHaveURL(/page=/);
  await expect(page.getByTestId('product-page')).toHaveAttribute(
    'data-page-direction',
    'backward',
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const backwardScrollY = await page.evaluate(() => window.scrollY);
  expect(backwardScrollY).toBeGreaterThan(500);
  expect(Math.abs(backwardScrollY - initialScrollY)).toBeLessThanOrEqual(32);
});

test('passes automated accessibility checks in explorer states', async ({
  page,
}) => {
  const baseResults = await new AxeBuilder({ page }).include('main').analyze();
  expect(
    baseResults.violations.filter(
      ({ impact }) => impact === 'critical' || impact === 'serious',
    ),
  ).toEqual([]);

  await page.getByLabel('Search products').fill('kayno');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.locator('html').evaluate((element) => {
    element.dataset.theme = 'dark';
  });
  await page.waitForTimeout(300);
  const suggestionResults = await new AxeBuilder({ page })
    .include('main')
    .analyze();
  expect(
    suggestionResults.violations.filter(
      ({ impact }) => impact === 'critical' || impact === 'serious',
    ),
  ).toEqual([]);

  await page.getByLabel('Search products').fill('');
  await page.getByRole('button', { name: 'Adistar 5', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const dialogResults = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .analyze();
  expect(
    dialogResults.violations.filter(
      ({ impact }) => impact === 'critical' || impact === 'serious',
    ),
  ).toEqual([]);
});

test('updates the explorer immediately when the footer language changes', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Language: EN' }).click();
  await page.getByRole('menuitemradio', { name: 'Deutsch' }).click();
  await expect(
    page.getByRole('heading', { name: 'Laufschuhe entdecken' }),
  ).toBeVisible();
  await expect(page.getByLabel('Produkte suchen')).toBeVisible();
  await expect(page).toHaveURL(/\/de\/catalogue\/$/);
});

for (const viewport of [
  { name: 'phone', width: 390, height: 844, columns: 1 },
  { name: 'tablet', width: 768, height: 1024, columns: 2 },
  { name: 'desktop', width: 1280, height: 900, columns: 3 },
]) {
  test(`keeps readable ${viewport.columns}-column cards at the ${viewport.name} viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.reload();
    await expect(page.getByTestId('product-card')).toHaveCount(12);

    const firstYCoordinates = await page
      .getByTestId('product-card')
      .evaluateAll((cards) =>
        cards.map((card) => Math.round(card.getBoundingClientRect().y)),
      );
    expect(new Set(firstYCoordinates.slice(0, viewport.columns)).size).toBe(1);
    if (viewport.columns > 1) {
      expect(firstYCoordinates[viewport.columns]).toBeGreaterThan(
        firstYCoordinates[0] ?? 0,
      );
    }

    if (shouldAssertVisualSnapshots) {
      await expect(page.locator('main')).toHaveScreenshot(
        `catalogue-${viewport.name}.png`,
        {
          animations: 'disabled',
          maxDiffPixelRatio: 0.05,
        },
      );
    }
  });
}
