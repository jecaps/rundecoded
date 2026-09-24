import { expect, test, type Page } from '@playwright/test';

async function waitForConsultationHydration(page: Page) {
  await expect(
    page.locator(
      'astro-island:has([data-testid="customer-consultation"]):not([ssr])',
    ),
  ).toHaveCount(1);
}

test('keeps answer text wrapping stable when an option is selected', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('en/consultation/');
  await waitForConsultationHydration(page);

  const option = page.getByRole('button', { name: /^Under 5 km/ });
  const description = option.getByText('Short runs and first sessions');
  const heightBeforeSelection = await description.evaluate(
    (element) => element.getBoundingClientRect().height,
  );

  await option.click();

  await expect(option).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() =>
      description.evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(heightBeforeSelection);
});

test('keeps a completed recommendation after refresh', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('en/consultation/');
  await waitForConsultationHydration(page);

  await expect(page.getByText('Guided shoe selection')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Customer consultation' }),
  ).toBeVisible();

  await page.getByRole('button', { name: /^Under 5 km/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /^Road/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Not sure yet/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /^Start running/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page
    .getByRole('button', { name: /^No preference \/ not sure/ })
    .click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /^No current concern/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Show recommendations' }).click();

  await expect(page).toHaveURL(/results=1/);
  await expect(
    page.getByRole('heading', { name: 'Best options for this customer' }),
  ).toBeVisible();

  const hydrationErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydration/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });
  await page.reload();
  await expect(
    page.locator(
      'astro-island:has([data-testid="consultation-results"]):not([ssr])',
    ),
  ).toHaveCount(1);

  await expect(
    page.getByRole('heading', { name: 'Best options for this customer' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /View details/ })).toHaveCount(
    5,
  );
  expect(hydrationErrors).toEqual([]);

  const firstExplanation = page
    .getByText('Why this shoe')
    .first()
    .locator('..');
  const firstRecommendation = page
    .getByRole('button', { name: /View details/ })
    .first();
  await expect(firstRecommendation).toHaveAttribute('data-slot', 'card');
  await expect
    .poll(async () => {
      const explanationBox = await firstExplanation.boundingBox();
      const cardBox = await firstRecommendation.boundingBox();
      return Boolean(
        explanationBox &&
        cardBox &&
        explanationBox.y + explanationBox.height <=
          cardBox.y + cardBox.height - 16,
      );
    })
    .toBe(true);

  const recommendationUrl = page.url();
  await firstRecommendation.focus();
  await firstRecommendation.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveURL(recommendationUrl);
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(firstRecommendation).toBeFocused();
});

test('aligns phone review actions and opens recommended shoes as pages', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('en/consultation/');
  await waitForConsultationHydration(page);

  await page.getByRole('button', { name: /^Under 5 km/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /^Road/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Not sure yet/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /^Start running/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page
    .getByRole('button', { name: /^No preference \/ not sure/ })
    .click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /^No current concern/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(
    page.getByRole('link', { name: 'Browse shoe catalogue' }),
  ).toBeHidden();
  await expect(
    page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'Catalogue' }),
  ).toBeVisible();
  const back = await page.getByRole('button', { name: 'Back' }).boundingBox();
  const show = await page
    .getByRole('button', { name: 'Show recommendations' })
    .boundingBox();
  expect(back && show).toBeTruthy();
  expect(Math.abs(back!.y - show!.y)).toBeLessThan(1);
  expect(Math.abs(back!.height - show!.height)).toBeLessThan(1);
  expect(back!.x + back!.width).toBeLessThan(show!.x);
  expect(show!.x - (back!.x + back!.width)).toBeGreaterThanOrEqual(8);
  expect(show!.x - (back!.x + back!.width)).toBeLessThanOrEqual(16);

  await page.setViewportSize({ width: 320, height: 844 });
  const narrowButtons = await Promise.all([
    page.getByRole('button', { name: 'Back' }).boundingBox(),
    page.getByRole('button', { name: 'Show recommendations' }).boundingBox(),
  ]);
  expect(narrowButtons.every(Boolean)).toBe(true);
  expect(
    Math.max(...narrowButtons.map((box) => box!.y)) -
      Math.min(...narrowButtons.map((box) => box!.y)),
  ).toBeLessThan(1);
  expect(
    narrowButtons.at(-1)!.x + narrowButtons.at(-1)!.width,
  ).toBeLessThanOrEqual(320);
  expect(
    narrowButtons[1]!.x - (narrowButtons[0]!.x + narrowButtons[0]!.width),
  ).toBeGreaterThanOrEqual(8);
  expect(
    narrowButtons[1]!.x - (narrowButtons[0]!.x + narrowButtons[0]!.width),
  ).toBeLessThanOrEqual(16);

  await page.setViewportSize({ width: 800, height: 844 });
  await expect(
    page.getByRole('link', { name: 'Browse shoe catalogue' }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });

  await page.getByRole('button', { name: 'Show recommendations' }).click();
  await expect(page).toHaveURL(/results=1/);
  const restart = await page
    .getByRole('button', { name: 'Start another consultation' })
    .boundingBox();
  const resultCatalogue = await page
    .getByRole('link', { name: 'Browse shoe catalogue' })
    .boundingBox();
  const showMore = await page
    .getByRole('button', { name: 'Show more recommendations' })
    .boundingBox();
  expect(restart && resultCatalogue && showMore).toBeTruthy();
  expect(Math.abs(restart!.x - resultCatalogue!.x)).toBeLessThan(1);
  expect(Math.abs(restart!.width - resultCatalogue!.width)).toBeLessThan(1);
  expect(Math.abs(restart!.height - resultCatalogue!.height)).toBeLessThan(1);
  expect(Math.abs(showMore!.x - restart!.x)).toBeLessThan(1);
  expect(Math.abs(showMore!.width - restart!.width)).toBeLessThan(1);
  expect(Math.abs(showMore!.height - restart!.height)).toBeLessThan(1);
  const actions = await page
    .getByRole('button', { name: 'Start another consultation' })
    .locator('..')
    .boundingBox();
  expect(actions).not.toBeNull();
  expect(
    Math.abs(
      restart!.x + restart!.width / 2 - (actions!.x + actions!.width / 2),
    ),
  ).toBeLessThan(1);
  const recommendation = page
    .getByRole('button', { name: /View details/ })
    .first();
  await recommendation.click();
  await expect(page).toHaveURL(/\/en\/catalogue\/[^/]+\/$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Recommendations' }),
  ).toBeVisible();
  await page.locator('[data-similar-shoe-id]').first().click();
  await expect(page).toHaveURL(/\/en\/catalogue\/[^/]+\/$/);
  await expect(
    page.getByRole('link', { name: 'Recommendations' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Recommendations' }).click();
  await expect(page).toHaveURL(/\/en\/consultation\/\?.*results=1/);
  await expect(
    page.getByRole('heading', { name: 'Best options for this customer' }),
  ).toBeVisible();
});
