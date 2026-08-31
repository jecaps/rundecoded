import { expect, test } from '@playwright/test';

function relativeLuminance(color: string) {
  const channels = color
    .match(/[\da-f]{2}/gi)
    ?.slice(0, 3)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );

  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit hex color, received ${color}`);
  }

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first: string, second: string) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

test('navigates between routes without changing the shared banner', async ({
  page,
}) => {
  await page.goto('./catalogue/?lang=en');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Explore running shoes' }),
  ).toBeVisible();

  const catalogueBanner = await page.locator('.app-banner').boundingBox();
  await page.getByRole('link', { name: 'Running Basics' }).click();

  await expect(page).toHaveURL(/\/rundecoded\/running-basics\/\?lang=en$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Running Basics' }),
  ).toBeVisible();
  const basicsBanner = await page.locator('.app-banner').boundingBox();

  expect(catalogueBanner).not.toBeNull();
  expect(basicsBanner).not.toBeNull();
  expect(basicsBanner?.height).toBeCloseTo(catalogueBanner?.height ?? 0, 0);
});

test('uses client-side navigation between primary routes', async ({ page }) => {
  await page.goto('./catalogue/?lang=en');
  await page.evaluate(() => {
    (window as Window & { __navigationMarker?: string }).__navigationMarker =
      'same-document';
  });

  await page.getByRole('link', { name: 'Running Basics' }).click();
  await expect(page).toHaveURL(/\/running-basics\/?\?lang=en$/);
  await expect(
    page.getByRole('heading', { name: 'Running Basics' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Running Basics' }),
  ).toHaveAttribute('aria-current', 'page');
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __navigationMarker?: string }).__navigationMarker,
    ),
  ).toBe('same-document');

  await page.goBack();
  await expect(page).toHaveURL(/\/catalogue\/?\?lang=en$/);
  await expect(
    page.getByRole('heading', { name: 'Explore running shoes' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __navigationMarker?: string }).__navigationMarker,
    ),
  ).toBe('same-document');
});

test('persists language and theme preferences across routes', async ({
  page,
}) => {
  await page.goto('./catalogue/?lang=en');

  await page.getByRole('button', { name: 'Language: EN' }).click();
  await page.getByRole('menuitemradio', { name: 'Deutsch' }).click();
  await expect(page).toHaveURL(/\?lang=de$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');

  const initialTheme = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: 'Farbschema wechseln' }).click();
  const selectedTheme = initialTheme === 'dark' ? 'light' : 'dark';
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    selectedTheme,
  );

  await page.getByRole('link', { name: 'Running Basics' }).click();
  await expect(page).toHaveURL(/\/running-basics\/\?lang=de$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    selectedTheme,
  );
});

test('keeps controls compact on phone and tablet widths', async ({ page }) => {
  for (const viewport of [
    { height: 844, width: 390 },
    { height: 1024, width: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('./catalogue/?lang=en');

    await expect(page.locator('.site-footer__controls')).toBeVisible();
    await expect(page.locator('.site-footer__credit')).toBeVisible();
    await expect(
      page.locator('.app-banner').getByLabel('Display preferences'),
    ).toHaveCount(0);

    const controlsBox = await page
      .locator('.site-footer__controls')
      .boundingBox();
    const creditBox = await page.locator('.site-footer__credit').boundingBox();
    expect(controlsBox).not.toBeNull();
    expect(creditBox).not.toBeNull();
    expect(Math.abs((controlsBox?.y ?? 0) - (creditBox?.y ?? 0))).toBeLessThan(
      16,
    );
  }
});

test('design-system primitives support keyboard interaction', async ({
  page,
}) => {
  await page.goto('./design-system/?lang=en');

  await page.getByRole('button', { name: 'Open dialog' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Accessible by default' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.getByRole('tab', { name: 'Usage' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tabpanel')).toContainText('Prefer native HTML');
});

test('semantic text colors meet WCAG AA contrast in both themes', async ({
  page,
}) => {
  await page.goto('./design-system/?lang=en');

  for (const theme of ['light', 'dark']) {
    await page.locator('html').evaluate((element, selectedTheme) => {
      element.dataset.theme = selectedTheme;
    }, theme);

    const colors = await page.locator('html').evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        background: styles.getPropertyValue('--background').trim(),
        foreground: styles.getPropertyValue('--foreground').trim(),
        muted: styles.getPropertyValue('--muted-foreground').trim(),
        primary: styles.getPropertyValue('--primary').trim(),
        surface: styles.getPropertyValue('--surface').trim(),
      };
    });

    expect(
      contrastRatio(colors.foreground, colors.background),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(colors.muted, colors.background),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.muted, colors.surface)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(
      contrastRatio(colors.primary, colors.background),
    ).toBeGreaterThanOrEqual(4.5);
  }
});
