import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('rundecoded-theme', 'light');
    localStorage.setItem('rundecoded-locale', 'en');
  });
  await page.goto('./catalogue/?lang=en');
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
  await page.getByRole('button', { name: 'Compare selected (2/2)' }).click();

  const comparison = page.getByRole('dialog');
  await expect(
    comparison.getByRole('heading', { name: 'Shoe comparison' }),
  ).toBeVisible();
  await expect(comparison).toContainText('Adistar 5');
  await expect(comparison).toContainText('Terrex Agravic 4');
});

test('opens comparison from a comparable product and includes the detail product', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: 'Jogflow 100.1', exact: true })
    .click();
  const details = page.getByRole('dialog');
  await details
    .getByRole('button', { name: 'Compare with Jogflow 190 Grip WP' })
    .click();

  const comparison = page.getByRole('dialog');
  await expect(
    comparison.getByRole('heading', { name: 'Shoe comparison' }),
  ).toBeVisible();
  await expect(comparison).toContainText('Jogflow 100.1');
  await expect(comparison).toContainText('Jogflow 190 Grip WP');
  await expect(comparison).toContainText(
    'Reference sizes differ, so weight is not highlighted.',
  );
  await expect(
    comparison.locator('[data-comparison-row="weight"]'),
  ).toHaveAttribute('data-difference', 'not-compared');
  await expect(comparison).not.toContainText(/price|€/i);
});

test('search and filters produce accurate counts and an honest empty state', async ({
  page,
}) => {
  await page.getByLabel('Search products').fill('Kayano');
  await expect(page.getByTestId('product-card')).toHaveCount(1);
  await expect(page.getByText('1 of 12 shoes')).toBeVisible();

  await page.getByLabel('Search products').fill('not-a-running-shoe');
  await expect(page.getByText('No shoes match these filters.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).last().click();
  await expect(page.getByTestId('product-card')).toHaveCount(12);

  await page.getByRole('button', { name: 'Trail', exact: true }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(3);
  await expect(page.getByText('3 of 12 shoes')).toBeVisible();
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
  await expect(page).toHaveURL(/\?lang=de$/);
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

    await expect(page.locator('main')).toHaveScreenshot(
      `catalogue-${viewport.name}.png`,
      {
        animations: 'disabled',
        maxDiffPixelRatio: 0.05,
      },
    );
  });
}
