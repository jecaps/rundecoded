import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const shouldAssertVisualSnapshots = !process.env.CI;

async function waitForGuide(page: Page) {
  await expect(page.getByTestId('running-basics-guide')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('rundecoded-theme', 'light');
    localStorage.setItem('rundecoded-locale', 'en');
  });
  await page.goto('./running-basics/?lang=en');
  await waitForGuide(page);
});

test('renders every approved topic in a calm editorial flow', async ({
  page,
}) => {
  const topics = page.getByTestId('running-basics-topics');
  for (const title of [
    'Pronation',
    'Foot strike',
    'Drop',
    'Stack height',
    'Cushioning',
    'Fit and sizing',
    'Training use',
  ]) {
    await expect(
      topics.getByRole('heading', { level: 2, name: title }),
    ).toBeAttached();
  }
  await expect(topics.locator('[data-topic]')).toHaveCount(7);
});

test('keeps a long topic jump selected and restores history accurately', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload();
  await waitForGuide(page);
  const navigation = page.getByTestId('desktop-topic-navigation');
  const footStrike = navigation.getByRole('link', { name: 'Foot strike' });
  const trainingUse = navigation.getByRole('link', { name: 'Training use' });

  await footStrike.click();
  await trainingUse.click();
  await expect(page).toHaveURL(/#training-use$/);
  await expect(trainingUse).toHaveAttribute('aria-current', 'location');
  await page.waitForTimeout(350);
  await expect(trainingUse).toHaveAttribute('aria-current', 'location');
  await expect(navigation.locator('[aria-current="location"]')).toHaveCount(1);
  await expect(page.locator('#training-use')).not.toHaveClass(/highlight/i);

  await page.goBack();
  await expect(page).toHaveURL(/#foot-strike$/);
  await expect(footStrike).toHaveAttribute('aria-current', 'location');
});

test('uses instant anchor movement when reduced motion is requested', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const original = Element.prototype.scrollIntoView;
    (
      window as Window & { __runningBasicsScrollBehaviors?: unknown[] }
    ).__runningBasicsScrollBehaviors = [];
    Element.prototype.scrollIntoView = function scrollIntoView(options) {
      (
        window as Window & { __runningBasicsScrollBehaviors?: unknown[] }
      ).__runningBasicsScrollBehaviors?.push(
        typeof options === 'object' ? options.behavior : undefined,
      );
      original.call(this, options);
    };
  });
  await page.reload();
  await waitForGuide(page);

  await page
    .getByTestId('desktop-topic-navigation')
    .getByRole('link', { name: 'Training use' })
    .click();
  const behavior = await page.evaluate(() =>
    (
      window as Window & { __runningBasicsScrollBehaviors?: unknown[] }
    ).__runningBasicsScrollBehaviors?.at(-1),
  );
  expect(behavior).toBe('auto');
});

test('opens mobile topics as an overlay and shows the chosen topic', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await waitForGuide(page);
  const selector = page.getByRole('button', { name: 'Select topic' });
  const pronation = page.locator('#pronation');
  const before = await pronation.evaluate(
    (element) => element.getBoundingClientRect().top,
  );

  await selector.click();
  await expect(
    page.getByRole('menuitemradio', { name: 'Training use' }),
  ).toBeVisible();
  const after = await pronation.evaluate(
    (element) => element.getBoundingClientRect().top,
  );
  expect(Math.abs(after - before)).toBeLessThan(2);

  await page.getByRole('menuitemradio', { name: 'Training use' }).click();
  await expect(page).toHaveURL(/#training-use$/);
  await expect(selector).toContainText('Training use');
});

for (const locale of [
  {
    code: 'en',
    pageTitle: 'Running Basics',
    topicTitle: 'Foot strike',
  },
  {
    code: 'de',
    pageTitle: 'Laufgrundlagen',
    topicTitle: 'Fußaufsatz',
  },
  {
    code: 'fr',
    pageTitle: 'Les bases de la course',
    topicTitle: 'Attaque du pied',
  },
]) {
  test(`renders complete ${locale.code.toUpperCase()} guide content`, async ({
    page,
  }) => {
    await page.goto(`./running-basics/?lang=${locale.code}#foot-strike`);
    await waitForGuide(page);
    await expect(
      page.getByRole('heading', { level: 1, name: locale.pageTitle }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: locale.topicTitle }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', locale.code);
  });
}

test('updates the guide immediately when the footer language changes', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Language: EN' }).click();
  await page.getByRole('menuitemradio', { name: 'Deutsch' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Laufgrundlagen' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Fußaufsatz' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\?lang=de$/);
});

test('passes accessibility checks and preserves responsive reading width', async ({
  page,
}) => {
  const results = await new AxeBuilder({ page }).include('main').analyze();
  expect(
    results.violations.filter(
      ({ impact }) => impact === 'critical' || impact === 'serious',
    ),
  ).toEqual([]);

  for (const viewport of [
    { name: 'phone', width: 390, height: 844 },
    { name: 'desktop', width: 1280, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.reload();
    await waitForGuide(page);
    const articleWidth = await page
      .getByTestId('running-basics-topics')
      .evaluate((element) => element.getBoundingClientRect().width);
    expect(articleWidth).toBeLessThanOrEqual(896);

    if (shouldAssertVisualSnapshots) {
      await expect(page.locator('main')).toHaveScreenshot(
        `running-basics-${viewport.name}.png`,
        { animations: 'disabled', maxDiffPixelRatio: 0.05 },
      );
    }
  }
});
