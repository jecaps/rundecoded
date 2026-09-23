import { expect, test } from '@playwright/test';

function relativeLuminance(color: string) {
  const hex = color.replace(/^#/, '');
  const expandedHex = hex.length === 3 ? hex.replace(/./g, '$&$&') : hex;
  const channels = expandedHex
    .match(/[\da-f]{2}/gi)
    ?.slice(0, 3)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );

  if (!channels || channels.length !== 3) {
    throw new Error(
      `Expected a three- or six-digit hex color, received ${color}`,
    );
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
  await page.goto('./en/catalogue/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Explore running shoes' }),
  ).toBeVisible();

  const catalogueBanner = await page.locator('.app-banner').boundingBox();
  await page.getByRole('link', { name: 'Learn' }).click();

  await expect(page).toHaveURL(/\/rundecoded\/en\/running-basics\/$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Running Basics' }),
  ).toBeVisible();
  const basicsBanner = await page.locator('.app-banner').boundingBox();

  expect(catalogueBanner).not.toBeNull();
  expect(basicsBanner).not.toBeNull();
  expect(basicsBanner?.height).toBeCloseTo(catalogueBanner?.height ?? 0, 0);
});

test('uses client-side navigation between primary routes', async ({ page }) => {
  await page.goto('./en/catalogue/');
  await page.evaluate(() => {
    (window as Window & { __navigationMarker?: string }).__navigationMarker =
      'same-document';
  });

  await page.getByRole('link', { name: 'Learn' }).click();
  await expect(page).toHaveURL(/\/en\/running-basics\/$/);
  await expect(
    page.getByRole('heading', { name: 'Running Basics' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Learn' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __navigationMarker?: string }).__navigationMarker,
    ),
  ).toBe('same-document');

  await page.goBack();
  await expect(page).toHaveURL(/\/en\/catalogue\/$/);
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

test('marks the selected primary route active as navigation starts', async ({
  page,
}) => {
  await page.goto('./en/catalogue/');

  const pendingState = await page.evaluate(() => {
    const link = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('[data-navigation-key]'),
    ).find((item) => item.dataset.navigationKey === 'consultation');
    const preparationEvent = new Event('astro:before-preparation');
    Object.defineProperty(preparationEvent, 'sourceElement', { value: link });
    document.dispatchEvent(preparationEvent);
    return {
      active: link?.getAttribute('aria-current'),
      busy: link?.getAttribute('aria-busy'),
      pending: link?.dataset.navigationPending,
    };
  });

  expect(pendingState).toEqual({
    active: 'page',
    busy: 'true',
    pending: 'true',
  });
  await expect(
    page.locator(
      '[data-navigation-key="consultation"] [data-navigation-skeleton]',
    ),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Guide', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/consultation\/$/);
  await expect(
    page.locator(
      '[data-navigation-key="consultation"] [data-navigation-skeleton]',
    ),
  ).toBeHidden();
});

test('reaches the customer consultation from the Guide destination', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./en/catalogue/');

  await page.getByRole('link', { name: 'Guide', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/consultation\/$/);
  await expect(
    page.getByRole('heading', { name: 'Customer consultation' }),
  ).toBeVisible();
});

test('persists language and theme preferences across routes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./en/catalogue/');

  await page.getByRole('button', { name: 'Language: EN' }).click();
  await page.getByRole('menuitemradio', { name: 'Deutsch' }).click();
  await expect(page).toHaveURL(/\/de\/catalogue\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');

  const initialTheme = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: 'Farbschema wechseln' }).click();
  const selectedTheme = initialTheme === 'dark' ? 'light' : 'dark';
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    selectedTheme,
  );

  await page.getByRole('link', { name: 'Lernen' }).click();
  await expect(page).toHaveURL(/\/de\/running-basics\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    selectedTheme,
  );

  await page.getByRole('link', { name: 'Katalog', exact: true }).click();
  await expect(page).toHaveURL(/\/de\/catalogue\/$/);
  await expect(page.getByTestId('product-explorer')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
  await expect(
    page.getByRole('heading', { level: 1, name: 'Laufschuhe entdecken' }),
  ).toBeVisible();
});

test('switches the application shell at the shared breakpoint boundaries', async ({
  page,
}) => {
  for (const viewport of [
    { footer: false, tabletHeader: false, width: 575 },
    { footer: false, tabletHeader: true, width: 576 },
    { footer: false, tabletHeader: true, width: 1024 },
    { footer: true, tabletHeader: false, width: 1025 },
  ]) {
    await page.setViewportSize({ height: 900, width: viewport.width });
    await page.goto('./en/catalogue/');

    if (viewport.footer) {
      await expect(page.locator('.site-footer')).toBeVisible();
    } else {
      await expect(page.locator('.site-footer')).toBeHidden();
    }

    if (viewport.tabletHeader) {
      await expect(page.locator('.tablet-app-header')).toBeVisible();
    } else {
      await expect(page.locator('.tablet-app-header')).toBeHidden();
    }
  }
});

test('keeps the tablet application shell on every primary route', async ({
  page,
}) => {
  await page.setViewportSize({ height: 1280, width: 800 });

  for (const destination of [
    { path: 'catalogue', activeLink: 'Catalogue' },
    { path: 'consultation', activeLink: 'Guide' },
    { path: 'compare', activeLink: 'Compare' },
    { path: 'running-basics', activeLink: 'Learn' },
  ]) {
    await page.goto(`./en/${destination.path}/`);

    await expect(page.locator('.app-banner')).toBeVisible();
    await expect(page.locator('.tablet-app-header')).toBeVisible();
    await expect(
      page.getByRole('link', { name: destination.activeLink, exact: true }),
    ).toHaveAttribute('aria-current', 'page');
  }
});

test('design-system primitives support keyboard interaction', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./en/design-system/');

  const dialogTrigger = page.getByRole('button', { name: 'Open dialog' });
  await dialogTrigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Accessible by default' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(dialogTrigger).toBeFocused();

  const usageTab = page.getByRole('tab', { name: 'Usage' });
  await usageTab.focus();
  await expect(usageTab).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tabpanel')).toContainText('Prefer native HTML');
});

test('semantic text colors meet WCAG AA contrast in both themes', async ({
  page,
}) => {
  await page.goto('./en/design-system/');

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
