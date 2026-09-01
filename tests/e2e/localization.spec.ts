import { expect, test } from '@playwright/test';

const productionBase = 'https://jecaps.github.io/rundecoded';

const localeCases = [
  {
    code: 'en',
    catalogueHeading: 'Explore running shoes',
    catalogueTitle: 'Running shoe catalogue | RunDecoded',
    languageButton: 'Language: EN',
  },
  {
    code: 'de',
    catalogueHeading: 'Laufschuhe entdecken',
    catalogueTitle: 'Laufschuh-Katalog | RunDecoded',
    languageButton: 'Sprache: DE',
  },
  {
    code: 'fr',
    catalogueHeading: 'Explorer les chaussures',
    catalogueTitle: 'Catalogue de chaussures de course | RunDecoded',
    languageButton: 'Langue: FR',
  },
] as const;

for (const locale of localeCases) {
  test(`renders the canonical ${locale.code.toUpperCase()} catalogue directly`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('rundecoded-locale', 'fr');
    });
    await page.goto(`./${locale.code}/catalogue/`);
    await expect(page.getByTestId('product-explorer')).toHaveAttribute(
      'data-hydrated',
      'true',
    );

    await expect(page.locator('html')).toHaveAttribute('lang', locale.code);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: locale.catalogueHeading,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: locale.languageButton }),
    ).toBeVisible();
    await expect(page).toHaveTitle(locale.catalogueTitle);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${productionBase}/${locale.code}/catalogue/`,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);

    for (const alternate of ['en', 'de', 'fr', 'x-default']) {
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${alternate}"]`),
      ).toHaveCount(1);
    }

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', locale.code);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: locale.catalogueHeading,
      }),
    ).toBeVisible();
  });
}

test('preserves catalogue search, filters, and browser history across languages', async ({
  page,
}) => {
  await page.goto('./en/catalogue/?q=Adidas&category=trail');
  await expect(page.getByLabel('Search products')).toHaveValue('Adidas');

  await page.getByRole('button', { name: 'Language: EN' }).click();
  await page.getByRole('menuitemradio', { name: 'Deutsch' }).click();
  await expect(page).toHaveURL(/\/de\/catalogue\/\?q=Adidas&category=trail$/);
  await expect(page.getByLabel('Produkte suchen')).toHaveValue('Adidas');

  await page.goBack();
  await expect(page).toHaveURL(/\/en\/catalogue\/\?q=Adidas&category=trail$/);
  await expect(page.getByLabel('Search products')).toHaveValue('Adidas');
});

test('preserves the current Running Basics topic when switching language', async ({
  page,
}) => {
  await page.goto('./fr/running-basics/#training-use');
  await expect(page.getByTestId('running-basics-guide')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
  await expect(
    page
      .getByTestId('desktop-topic-navigation')
      .getByRole('link', { name: 'Usage d’entraînement' }),
  ).toHaveAttribute('aria-current', 'location');

  await page.getByRole('button', { name: 'Langue: FR' }).click();
  await page.getByRole('menuitemradio', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/running-basics\/#training-use$/);
  await expect(
    page
      .getByTestId('desktop-topic-navigation')
      .getByRole('link', { name: 'Training use' }),
  ).toHaveAttribute('aria-current', 'location');
});

test('redirects legacy query locales and intentionally rejects unknown route locales', async ({
  page,
}) => {
  await page.goto('./catalogue/?lang=fr&q=Adidas#results');
  await expect(page).toHaveURL(/\/fr\/catalogue\/\?q=Adidas#results$/);
  await expect(
    page.getByRole('heading', { name: 'Explorer les chaussures' }),
  ).toBeVisible();

  const response = await page.goto('./es/catalogue/');
  expect(response?.status()).toBe(404);
});

test('uses the localized home route and never lets stored French override English', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('rundecoded-locale', 'fr');
  });
  await page.goto('./en/');
  await expect(page).toHaveURL(/\/en\/catalogue\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.getByRole('heading', { name: 'Explore running shoes' }),
  ).toBeVisible();
});
