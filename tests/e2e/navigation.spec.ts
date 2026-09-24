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
    { footer: false, tabletHeader: true, width: 575 },
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

test('keeps the phone header and four fixed destinations separate from the tablet rail', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('./en/catalogue/');

  const navigation = page.getByRole('navigation', {
    name: 'Primary navigation',
  });
  await expect(page.locator('.tablet-app-header')).toBeVisible();
  await expect(navigation).toBeVisible();
  for (const label of ['Catalogue', 'Guide', 'Compare', 'Learn']) {
    await expect(
      navigation.getByRole('link', { name: label, exact: true }),
    ).toBeVisible();
  }
  const itemOffsets = await navigation.locator('li').evaluateAll((items) =>
    items.map((item) => {
      const cell = item.getBoundingClientRect();
      const link = item.querySelector('a')!.getBoundingClientRect();
      return Math.abs(
        cell.left + cell.width / 2 - (link.left + link.width / 2),
      );
    }),
  );
  expect(Math.max(...itemOffsets)).toBeLessThan(1);
  const phoneLayout = await navigation.evaluate((nav) => {
    const list = nav.querySelector('ul')!;
    const links = [...nav.querySelectorAll('a')];
    const navBox = nav.getBoundingClientRect();
    const linkBoxes = links.map((link) => link.getBoundingClientRect());
    return {
      display: getComputedStyle(list).display,
      paddingTop: getComputedStyle(nav).paddingTop,
      paddingBottom: getComputedStyle(nav).paddingBottom,
      firstLeft: linkBoxes[0]!.left - navBox.left,
      lastRight: navBox.right - linkBoxes.at(-1)!.right,
      widths: linkBoxes.map((box) => box.width),
      height: linkBoxes[0]!.height,
      navHeight: navBox.height,
      activeRadius: getComputedStyle(links[0]!, '::after').borderRadius,
    };
  });
  expect(phoneLayout.display).toBe('flex');
  expect(phoneLayout.paddingTop).toBe('0px');
  expect(phoneLayout.paddingBottom).toBe('0px');
  expect(phoneLayout.firstLeft).toBe(0);
  expect(phoneLayout.lastRight).toBe(0);
  expect(
    Math.max(...phoneLayout.widths) - Math.min(...phoneLayout.widths),
  ).toBeLessThan(1);
  expect(phoneLayout.height).toBeGreaterThanOrEqual(68);
  expect(phoneLayout.height).toBe(phoneLayout.navHeight);
  expect(phoneLayout.activeRadius).toBe('0px');
  const phoneNavBox = await page.locator('.app-banner').boundingBox();
  expect(phoneNavBox?.y).toBeGreaterThan(700);

  await navigation.getByRole('link', { name: 'Compare' }).click();
  await expect(page).toHaveURL(/\/en\/compare\/$/);
  await expect(
    navigation.getByRole('link', { name: 'Compare' }),
  ).toHaveAttribute('aria-current', 'page');

  await page.setViewportSize({ height: 844, width: 800 });
  const tabletNavBox = await page.locator('.app-banner').boundingBox();
  expect(tabletNavBox?.x).toBe(0);
  expect(tabletNavBox?.width).toBeLessThan(100);
});

test('uses compact, matching phone content insets on every primary route', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  for (const route of [
    'catalogue',
    'consultation',
    'compare',
    'running-basics',
  ]) {
    await page.goto(`./en/${route}/`);
    const mainPadding = await page
      .locator('main')
      .evaluate((element) => getComputedStyle(element).paddingBottom);
    expect(mainPadding).toBe('68px');
    const section = page.locator('main .app-route').first();
    await expect(section).toBeVisible();
    const padding = await section.evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.paddingTop, style.paddingBottom];
    });
    expect(padding).toEqual(['16px', '16px']);
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

test('opens phone settings as a route without a version section', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./en/catalogue/');
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/en\/settings\/$/);
  await expect(
    page.getByRole('button', { name: 'Language: English' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();
  await expect(page.getByText('Version')).toHaveCount(0);
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeHidden();

  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'System' }).click();
  expect(
    await page.evaluate(() => localStorage.getItem('rundecoded-theme')),
  ).toBeNull();
  await page.getByRole('button', { name: 'Language: English' }).click();
  await page.getByRole('button', { name: 'Deutsch' }).click();
  await expect(page).toHaveURL(/\/de\/settings\/$/);
  await page.getByRole('link', { name: 'Zurück' }).click();
  await expect(page).toHaveURL(/\/de\/catalogue\/$/);
});

test('opens a phone shoe route and returns to the filtered catalogue', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./en/catalogue/?q=Adistar');
  await expect(page.getByTestId('product-explorer')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
  await page.getByRole('link', { name: 'Open details for Adistar 5' }).click();
  await expect(page).toHaveURL(/\/en\/catalogue\/adidas-adistar-5\/$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Adistar 5' }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeHidden();
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Added', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Catalogue', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/catalogue\/\?q=Adistar$/);
  await expect(page.getByTestId('product-explorer')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
  const row = page.getByTestId('mobile-product-row').first();
  await expect(
    row.getByRole('link', { name: 'Open details for Adistar 5' }),
  ).toBeVisible();
  await expect(row).toHaveAttribute('data-selected', 'true');
});

test('restores the phone catalogue scroll position after shoe details', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./en/catalogue/');
  await expect(page.getByTestId('product-explorer')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
  const shoe = page.getByTestId('mobile-product-row').nth(8).getByRole('link');
  await shoe.scrollIntoViewIfNeeded();
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeGreaterThan(100);
  await shoe.click();
  await expect(page).toHaveURL(/\/en\/catalogue\/[^/]+\/$/);
  await page.getByRole('link', { name: 'Catalogue', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/catalogue\/$/);
  await expect
    .poll(async () => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(scrollY - 10);
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
