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

test('opens details from the card image and name and restores focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  const card = page.getByTestId('product-card').first();
  const image = card.getByRole('button', {
    name: 'Open details for Adistar 5',
  });
  const title = page.getByRole('button', { name: 'Adistar 5', exact: true });
  const dialog = page.getByRole('dialog');

  for (const opener of [image, title]) {
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
  await expect(dialog).toContainText('Construction & ride');
  await expect(dialog).not.toContainText(/price|€/i);
});

test('opens comparison after selecting two product cards', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  const cards = page.getByTestId('product-card');
  await cards.nth(0).getByRole('button', { name: 'Compare' }).click();
  await cards.nth(1).getByRole('button', { name: 'Compare' }).click();
  const compareSelected = page.getByRole('button', {
    name: 'Compare (2/2)',
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
  await expect(page.getByLabel('Search products')).toBeFocused();
});

test('uses the Compare tab instead of a dialog on tablet', async ({ page }) => {
  await page.setViewportSize({ height: 1280, width: 800 });

  await page.getByRole('link', { name: 'Compare', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/compare\/$/);
  const emptyComparison = page.getByTestId('tablet-comparison-view');
  await expect(emptyComparison).toBeVisible();
  await expect(emptyComparison).toContainText(
    'No shoes selected for comparison.',
  );
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('link', { name: 'Browse shoes' }).click();
  await expect(page).toHaveURL(/\/en\/catalogue\/$/);
  await page
    .getByTestId('product-card')
    .filter({ hasText: 'Adistar 5' })
    .getByRole('button', { name: 'Compare' })
    .click();
  await page
    .getByTestId('product-card')
    .filter({ hasText: 'Adizero Boston 13' })
    .getByRole('button', { name: 'Compare' })
    .click();
  const comparisonCount = page.locator('[data-comparison-count]');
  await expect(comparisonCount).toBeVisible();
  await expect(comparisonCount).toHaveText('2');
  const selectionTray = page.getByRole('region', {
    name: 'Shoe comparison selection',
  });
  await expect(selectionTray).toBeVisible();
  await expect(selectionTray).toContainText('Adistar 5');
  await expect(selectionTray).toContainText('Adizero Boston 13');
  await selectionTray.getByRole('link', { name: 'Compare (2/2)' }).click();
  await expect(page).toHaveURL(/\/en\/compare\/$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('link', { name: 'Learn', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/running-basics\/$/);
  await expect(page.locator('[data-comparison-count]')).toHaveText('2');
  await page.getByRole('link', { name: 'Compare', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/compare\/$/);

  const comparison = page.getByTestId('tablet-comparison-view');
  await expect(comparison).toContainText('Adistar 5');
  await expect(comparison).toContainText('Adizero Boston 13');
  await expect(comparison).toContainText('Key differences');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('restores a selected tablet card without a visible deselection flash', async ({
  page,
}) => {
  await page.setViewportSize({ height: 1280, width: 800 });
  await page
    .getByTestId('product-card')
    .filter({ hasText: 'Adizero Agravic Speed 2' })
    .getByRole('button', { name: 'Compare' })
    .click();
  await page.getByRole('link', { name: 'Find', exact: true }).click();

  await page.evaluate(() => {
    const state = window as Window & {
      __comparisonButtonStates?: string[];
      __stopComparisonSampling?: boolean;
    };
    state.__comparisonButtonStates = [];
    state.__stopComparisonSampling = false;

    function sampleComparisonButton() {
      const card = Array.from(
        document.querySelectorAll<HTMLElement>('[data-testid="product-card"]'),
      ).find((item) => item.textContent?.includes('Adizero Agravic Speed 2'));
      const button = card?.querySelector<HTMLElement>(
        '[data-comparison-state]',
      );
      if (button && getComputedStyle(button).visibility !== 'hidden') {
        state.__comparisonButtonStates?.push(button.textContent?.trim() ?? '');
      }
      if (!state.__stopComparisonSampling) {
        requestAnimationFrame(sampleComparisonButton);
      }
    }

    requestAnimationFrame(sampleComparisonButton);
  });

  await page.getByRole('link', { name: 'Catalogue', exact: true }).click();
  await expect(
    page
      .getByTestId('product-card')
      .filter({ hasText: 'Adizero Agravic Speed 2' })
      .getByRole('button', { name: 'Added' }),
  ).toBeVisible();

  const visibleStates = await page.evaluate(() => {
    const state = window as Window & {
      __comparisonButtonStates?: string[];
      __stopComparisonSampling?: boolean;
    };
    state.__stopComparisonSampling = true;
    return state.__comparisonButtonStates ?? [];
  });
  expect(visibleStates).not.toContain('Compare');
  expect(visibleStates).toContain('Added');
});

test('opens comparison from a comparable product and includes the detail product', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
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

  await page
    .getByRole('button', { name: 'All categories', exact: true })
    .click();
  await page
    .getByRole('menuitemradio', { name: 'Trail / off-road', exact: true })
    .click();
  await expect(page.getByTestId('product-card')).toHaveCount(12);
  await expect(page.getByText('45 of 106 shoes')).toBeVisible();
  await expect(page).toHaveURL(/category=surface%3Aoff-road/);
});

test('keeps filter control and result row dimensions stable', async ({
  page,
}) => {
  const categoryTrigger = page.getByRole('button', {
    name: 'All categories',
    exact: true,
  });
  const resultsBar = page.getByTestId('catalogue-results-bar');
  const initialCategoryBox = await categoryTrigger.boundingBox();
  const initialResultsBox = await resultsBar.boundingBox();

  await categoryTrigger.click();
  await page
    .getByRole('menuitemradio', { name: 'Trail / off-road', exact: true })
    .click();
  await expect(page.getByText('45 of 106 shoes')).toBeVisible();

  const filteredCategoryBox = await page
    .getByRole('button', { name: 'Trail / off-road', exact: true })
    .boundingBox();
  const filteredResultsBox = await resultsBar.boundingBox();

  expect(filteredCategoryBox?.width).toBe(initialCategoryBox?.width);
  expect(filteredResultsBox?.height).toBe(initialResultsBox?.height);
});

test('keeps neighboring tablet card content aligned with natural badge height', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.reload();

  const cards = page.getByTestId('product-card');
  const firstCard = cards.nth(0);
  const secondCard = cards.nth(1);

  const compactTitle = await firstCard
    .getByRole('button', { name: 'Adistar 5', exact: true })
    .boundingBox();
  const compactBadges = await firstCard
    .getByTestId('card-badges')
    .boundingBox();
  expect(compactTitle?.height).toBeLessThan(40);
  expect(compactBadges?.height).toBeLessThanOrEqual(28);

  for (const testId of ['card-best-for', 'card-metrics']) {
    const firstBox = await firstCard.getByTestId(testId).boundingBox();
    const secondBox = await secondCard.getByTestId(testId).boundingBox();
    expect(firstBox?.y).toBeCloseTo(secondBox?.y ?? 0, 0);
  }

  const firstAction = await firstCard
    .getByRole('button', { name: 'Compare' })
    .boundingBox();
  const secondAction = await secondCard
    .getByRole('button', { name: 'Compare' })
    .boundingBox();
  expect(firstAction?.y).toBeCloseTo(secondAction?.y ?? 0, 0);
});

test('scales card typography with the available card width', async ({
  page,
}) => {
  const sizes: Array<{ badge: number; title: number }> = [];

  for (const width of [576, 768, 1024]) {
    await page.setViewportSize({ width, height: 1024 });
    await page.reload();

    const firstCard = page.getByTestId('product-card').first();
    if (width === 576) {
      const longModel = page
        .getByTestId('product-card')
        .nth(1)
        .getByRole('button', {
          name: 'Adizero Agravic Speed 2',
          exact: true,
        });
      expect(
        await longModel.evaluate((element) => ({
          fits: element.scrollWidth <= element.clientWidth,
          whiteSpace: getComputedStyle(element).whiteSpace,
        })),
      ).toEqual({ fits: true, whiteSpace: 'nowrap' });
    }

    sizes.push({
      badge: await firstCard
        .getByTestId('card-badges')
        .locator('[data-card-badge]')
        .first()
        .evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).fontSize),
        ),
      title: await firstCard
        .getByRole('button', { name: 'Adistar 5', exact: true })
        .evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).fontSize),
        ),
    });
  }

  expect(sizes[0].title).toBeLessThan(sizes[1].title);
  expect(sizes[1].title).toBeLessThan(sizes[2].title);
  expect(sizes[0].badge).toBeLessThan(sizes[1].badge);
  expect(sizes[1].badge).toBeLessThan(sizes[2].badge);
});

test('keeps compact single-line card headers at 580px', async ({ page }) => {
  await page.setViewportSize({ width: 580, height: 1024 });
  await page.reload();

  const cards = page.getByTestId('product-card');
  const spacing = await page.evaluate(() => {
    const main = document.querySelector('main');
    const productPage = document.querySelector('[data-testid="product-page"]');
    return {
      columnGap: Number.parseFloat(
        productPage ? getComputedStyle(productPage).columnGap : '0',
      ),
      mainPadding: Number.parseFloat(
        main ? getComputedStyle(main).paddingInlineStart : '0',
      ),
    };
  });
  expect(spacing.columnGap).toBeLessThanOrEqual(12);
  expect(spacing.mainPadding).toBeLessThanOrEqual(12);

  for (const card of [cards.nth(0), cards.nth(1)]) {
    const badges = await card.getByTestId('card-badges').boundingBox();
    expect(badges?.height).toBeLessThanOrEqual(28);
  }

  const longModel = cards.nth(1).getByRole('button', {
    name: 'Adizero Agravic Speed 2',
    exact: true,
  });
  expect(
    await longModel.evaluate((element) => ({
      fits: element.scrollWidth <= element.clientWidth,
      whiteSpace: getComputedStyle(element).whiteSpace,
    })),
  ).toEqual({ fits: true, whiteSpace: 'nowrap' });
});

test('contains the category menu within the viewport on narrow screens', async ({
  page,
}) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('./en/catalogue/');
    await expect(page.getByTestId('product-explorer')).toHaveAttribute(
      'data-hydrated',
      'true',
    );

    const categoryMenu = page.getByRole('button', {
      name: 'All categories',
      exact: true,
    });
    await expect(categoryMenu).toBeVisible();
    const categoryMenuBox = await categoryMenu.boundingBox();
    const documentWidth = await page.evaluate(() =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    );

    expect(categoryMenuBox).not.toBeNull();
    expect(
      (categoryMenuBox?.x ?? 0) + (categoryMenuBox?.width ?? 0),
    ).toBeLessThanOrEqual(width);
    expect(documentWidth).toBeLessThanOrEqual(width);
  }
});

test('uses compact catalogue rows on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();

  const rows = page.getByTestId('mobile-product-row');
  await expect(rows).toHaveCount(12);
  await expect(page.getByTestId('product-card')).toHaveCount(0);
  await expect(page.getByText('Product explorer')).toBeHidden();
  await expect(
    page.getByRole('heading', {
      name: 'Help a customer choose the right shoe',
    }),
  ).toBeHidden();

  const firstRow = rows.first();
  await expect(firstRow).toContainText('Adistar 5');
  await expect(firstRow).toContainText('Best for:');
  await expect(firstRow).toContainText('Distance: 42 km · Drop: 6 mm');
  await expect(firstRow).not.toContainText('Adidas');
  await expect(firstRow.locator('[data-mobile-tag]')).toHaveCount(2);
  const longModelName = rows
    .nth(1)
    .getByText('Adizero Agravic Speed 2', { exact: true });
  expect(
    await longModelName.evaluate((element) => ({
      fits: element.scrollWidth <= element.clientWidth,
      whiteSpace: getComputedStyle(element).whiteSpace,
    })),
  ).toEqual({ fits: true, whiteSpace: 'normal' });

  const thumbnail = firstRow.locator('img');
  await expect(thumbnail).toHaveAttribute('loading', 'lazy');
  const thumbnailBox = await thumbnail.boundingBox();
  expect(thumbnailBox?.width).toBeGreaterThan(0);
  expect(thumbnailBox?.height).toBeGreaterThan(0);

  const compare = firstRow.getByRole('button', {
    name: 'Add Adistar 5 to comparison',
  });
  const compareBox = await compare.boundingBox();
  expect(compareBox?.width).toBeGreaterThanOrEqual(44);
  expect(compareBox?.height).toBeGreaterThanOrEqual(44);
  await compare.click();
  await expect(firstRow).toHaveAttribute('data-selected', 'true');
  await expect(
    firstRow.getByRole('button', { name: 'Deselect Adistar 5' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const detailsOpener = firstRow.getByRole('button', {
    name: 'Open details for Adistar 5',
  });
  await detailsOpener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(detailsOpener).toBeFocused();

  for (const width of [320, 575]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(rows).toHaveCount(12);
    const documentWidth = await page.evaluate(() =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    );
    expect(documentWidth).toBeLessThanOrEqual(width);
  }
});

test('restores compact rows after returning from consultation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./en/catalogue/');
  await expect(page.getByTestId('mobile-product-row')).toHaveCount(12);

  await page.goto('./en/consultation/');
  await page.goBack();

  await expect(page.getByTestId('mobile-product-row')).toHaveCount(12);
  await expect(page.getByTestId('product-card')).toHaveCount(0);
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
  await page
    .getByRole('button', { name: 'All categories', exact: true })
    .click();
  await page
    .getByRole('menuitemradio', { name: 'Trail / off-road', exact: true })
    .click();
  await expect(page).toHaveURL(/category=surface%3Aoff-road/);
  await expect(page.getByTestId('product-card')).toHaveCount(12);

  await page.reload();
  await expect(page.getByTestId('product-explorer')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
  await expect(
    page.getByRole('button', { name: 'Trail / off-road', exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(12);

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page).not.toHaveURL(/category=/);
  await page.goBack();
  await expect(page).toHaveURL(/category=surface%3Aoff-road/);
  await expect(
    page.getByRole('button', { name: 'Trail / off-road', exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(12);
  expect(consoleErrors.join('\n')).not.toMatch(/hydration|didn't match/i);
});

test('changes result pages without moving the viewport', async ({ page }) => {
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
  expect(
    Math.max(...initialCardHeights) - Math.min(...initialCardHeights),
  ).toBeLessThanOrEqual(2);

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
  expect(
    Math.max(...forwardCardHeights) - Math.min(...forwardCardHeights),
  ).toBeLessThanOrEqual(2);
  expect(
    Math.abs((forwardCardHeights[0] ?? 0) - (initialCardHeights[0] ?? 0)),
  ).toBeLessThanOrEqual(2);
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
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
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
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await page.getByRole('button', { name: 'Language: EN' }).click();
  await page.getByRole('menuitemradio', { name: 'Deutsch' }).click();
  await expect(
    page.getByRole('heading', { name: 'Laufschuhe entdecken' }),
  ).toBeVisible();
  await expect(page.getByLabel('Produkte suchen')).toBeVisible();
  await expect(page).toHaveURL(/\/de\/catalogue\/$/);
});

for (const viewport of [
  { layout: 'rows', name: 'phone', width: 390, height: 844, columns: 1 },
  { layout: 'cards', name: 'tablet', width: 768, height: 1024, columns: 2 },
  { layout: 'cards', name: 'desktop', width: 1280, height: 900, columns: 2 },
]) {
  test(`keeps readable ${viewport.layout} at the ${viewport.name} viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.reload();
    const products = page.getByTestId(
      viewport.width < 576 ? 'mobile-product-row' : 'product-card',
    );
    await expect(products).toHaveCount(12);

    const firstYCoordinates = await products.evaluateAll((items) =>
      items.map((item) => Math.round(item.getBoundingClientRect().y)),
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

test('keeps the card catalogue at the largest tablet viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 700 });
  await page.reload();

  await expect(page.getByTestId('product-card')).toHaveCount(12);
  await expect(page.getByTestId('catalogue-detail-pane')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Adizero Boston 13', exact: true })
    .click();
  await expect(
    page.getByRole('dialog').getByRole('heading', {
      name: 'Adizero Boston 13',
    }),
  ).toBeVisible();
});

for (const viewport of [
  { expected: 'phone', width: 575 },
  { expected: 'tablet', width: 576 },
  { expected: 'tablet', width: 1024 },
  { expected: 'desktop', width: 1025 },
] as const) {
  test(`uses the ${viewport.expected} catalogue at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: 900 });
    await page.reload();

    if (viewport.expected === 'phone') {
      await expect(page.getByTestId('mobile-product-row')).toHaveCount(12);
      await expect(page.getByTestId('product-card')).toHaveCount(0);
    } else {
      await expect(page.getByTestId('product-card')).toHaveCount(12);
      await expect(page.getByTestId('mobile-product-row')).toHaveCount(0);
    }
  });
}
