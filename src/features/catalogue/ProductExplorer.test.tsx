import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProductExplorer } from './ProductExplorer';
import { getProductCatalogue } from './catalogue';

const products = getProductCatalogue();
const originalMatchMedia = window.matchMedia;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.sessionStorage.clear();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: originalMatchMedia,
  });
});

describe('ProductExplorer', () => {
  it('renders the first 12-product page without card prices or weights', () => {
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
      />,
    );
    expect(screen.getAllByTestId('product-card')).toHaveLength(12);
    const firstCard = screen.getAllByTestId('product-card')[0];
    expect(firstCard).toBeDefined();
    expect(firstCard!.parentElement).toHaveAttribute('data-slot', 'card');
    expect(
      within(firstCard!).queryByText(/€|price|264 g/i),
    ).not.toBeInTheDocument();
    expect(firstCard!.querySelectorAll('[data-card-badge]')).toHaveLength(2);
    expect(
      firstCard!.querySelector('[data-card-badge="purpose"]'),
    ).toHaveTextContent('Max cushion');
    expect(
      firstCard!.querySelector('[data-card-badge="stability"]'),
    ).toHaveTextContent('Neutral');
    expect(within(firstCard!).getByTestId('card-best-for')).toHaveClass(
      'truncate',
    );
    expect(within(firstCard!).getByTestId('card-best-for')).toHaveAttribute(
      'title',
    );
    expect(
      within(firstCard!).getByTestId('card-best-for'),
    ).not.toHaveTextContent('All levels');
    expect(within(firstCard!).getByTestId('card-distance')).toHaveTextContent(
      '42 km',
    );
    expect(within(firstCard!).queryByText('Surface')).not.toBeInTheDocument();
    expect(within(firstCard!).queryByText('Stability')).not.toBeInTheDocument();
  });

  it('updates result counts for typed search and category filters', () => {
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
      />,
    );
    fireEvent.change(screen.getByLabelText('Search products'), {
      target: { value: 'Kayano' },
    });
    expect(screen.getAllByTestId('product-card')).toHaveLength(2);
    expect(screen.getByText('2 of 106 shoes')).toBeVisible();
  });

  it('groups purpose, surface, and terrain choices in the catalogue menu', async () => {
    window.history.replaceState({}, '', '/en/catalogue/');
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
      />,
    );

    fireEvent.pointerDown(
      screen.getByRole('button', { name: /All categories/ }),
    );
    expect(await screen.findByText('Purpose')).toBeVisible();
    expect(screen.getByText('Surface & terrain')).toBeVisible();
    fireEvent.click(
      screen.getByRole('menuitemradio', { name: 'Gravel & firm paths' }),
    );

    expect(
      screen.getByRole('button', { name: /Gravel & firm paths/ }),
    ).toBeVisible();
    expect(window.location.search).toBe('?category=terrain%3Agravel');
  });

  it('presents catalogue controls without a duplicate consultation entry', async () => {
    window.history.replaceState(
      {},
      '',
      '/en/catalogue/?surface=Gravel&stability=neutral',
    );
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
      />,
    );

    expect(
      screen.queryByRole('heading', {
        name: 'Help a customer choose the right shoe',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Start customer consultation' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /All categories/ }),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Filters' })).toBeNull();
    await waitFor(() => expect(window.location.search).toBe(''));
  });

  it('lets users manage selected comparison shoes from the selection tray', async () => {
    window.history.replaceState({}, '', '/en/catalogue/');
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
      />,
    );

    const compareButtons = screen.getAllByRole('button', { name: 'Compare' });
    fireEvent.click(compareButtons[0]!);
    fireEvent.click(compareButtons[1]!);

    expect(screen.getAllByRole('button', { name: 'Added' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /^Deselect / })).toHaveLength(
      2,
    );
    const selectionTray = screen.getByRole('region', {
      name: 'Shoe comparison selection',
    });
    expect(selectionTray).toBeVisible();
    expect(selectionTray).toHaveClass('flex', 'items-center');
    expect(within(selectionTray).getByText('Adistar 5')).toBeVisible();
    expect(
      within(selectionTray).getByText('Adizero Agravic Speed 2'),
    ).toBeVisible();
    fireEvent.click(compareButtons[2]!);
    const selectionWarning = await screen.findByText(
      'Two shoes are already selected. Remove one before adding another.',
    );
    expect(selectionWarning).toBeVisible();
    expect(selectionWarning.closest('[data-sonner-toast]')).toHaveAttribute(
      'data-type',
      'error',
    );

    fireEvent.click(screen.getAllByRole('button', { name: /^Deselect / })[0]!);
    expect(screen.getAllByRole('button', { name: 'Added' })).toHaveLength(1);
    await waitFor(() => {
      expect(
        screen.queryByText(
          'Two shoes are already selected. Remove one before adding another.',
        ),
      ).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /^Deselect / })[0]!);
    expect(
      screen.queryByRole('region', { name: 'Shoe comparison selection' }),
    ).not.toBeInTheDocument();
  });

  it('hides the selection tray while comparing and clears it after closing', async () => {
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
      />,
    );

    const compareButtons = screen.getAllByRole('button', { name: 'Compare' });
    fireEvent.click(compareButtons[0]!);
    fireEvent.click(compareButtons[1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Compare (2/2)' }));

    expect(screen.getByRole('dialog')).toBeVisible();
    expect(
      screen.queryByRole('region', { name: 'Shoe comparison selection' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('region', { name: 'Shoe comparison selection' }),
      ).not.toBeInTheDocument();
      expect(screen.queryAllByRole('button', { name: 'Added' })).toHaveLength(
        0,
      );
    });
  });

  it('uses a dedicated tablet comparison view for zero, one, and two shoes', async () => {
    const emptyRender = render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
        view="comparison"
      />,
    );

    const emptyView = await screen.findByTestId('tablet-comparison-view');
    expect(
      within(emptyView).getByText('No shoes selected for comparison.'),
    ).toBeVisible();
    expect(
      within(emptyView).getByRole('link', { name: 'Browse shoes' }),
    ).toHaveAttribute('href', '/en/catalogue/');

    emptyRender.unmount();
    window.sessionStorage.setItem(
      'rundecoded:catalogue-comparison-selection',
      JSON.stringify([products[0]!.product.id]),
    );
    const singleRender = render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
        view="comparison"
      />,
    );
    expect(
      await screen.findByText('Select another shoe to start the comparison.'),
    ).toBeVisible();

    singleRender.unmount();
    window.sessionStorage.setItem(
      'rundecoded:catalogue-comparison-selection',
      JSON.stringify([products[0]!.product.id, products[2]!.product.id]),
    );
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
        view="comparison"
      />,
    );

    const comparisonView = await screen.findByTestId('tablet-comparison-view');
    expect(within(comparisonView).getByText('Adistar 5')).toBeVisible();
    expect(within(comparisonView).getByText('Adizero Boston 13')).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(
      within(comparisonView).getByRole('button', {
        name: 'Deselect Adizero Boston 13',
      }),
    );
    expect(
      await screen.findByText('Select another shoe to start the comparison.'),
    ).toBeVisible();
  });

  it('restores selected shoes after navigating away from the catalogue', async () => {
    window.sessionStorage.setItem(
      'rundecoded:catalogue-comparison-selection',
      JSON.stringify([products[0]!.product.id, products[2]!.product.id]),
    );
    window.history.replaceState({}, '', '/en/compare/');

    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
        view="comparison"
      />,
    );

    const comparisonView = await screen.findByTestId('tablet-comparison-view');
    expect(await within(comparisonView).findByText('Adistar 5')).toBeVisible();
    expect(within(comparisonView).getByText('Adizero Boston 13')).toBeVisible();

    fireEvent.click(
      within(comparisonView).getByRole('button', {
        name: 'Clear comparison',
      }),
    );
    expect(
      await screen.findByText('No shoes selected for comparison.'),
    ).toBeVisible();
    expect(
      window.sessionStorage.getItem(
        'rundecoded:catalogue-comparison-selection',
      ),
    ).toBeNull();
  });

  it('offers keyboard-selectable typo-tolerant suggestions', () => {
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
      />,
    );
    const search = screen.getByLabelText('Search products');
    fireEvent.change(search, { target: { value: 'kayno' } });
    expect(
      screen.getByRole('listbox', { name: 'Search suggestions' }),
    ).toBeVisible();
    expect(screen.getByRole('option', { name: /Gel Kayano 32/ })).toBeVisible();
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(search).toHaveValue('Gel Kayano 32');
    expect(screen.getAllByTestId('product-card')).toHaveLength(1);
  });

  it('moves between anchored result pages with directional transitions', () => {
    window.history.replaceState({}, '', '/en/catalogue/');
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByTestId('product-page')).toHaveAttribute(
      'data-page-direction',
      'forward',
    );
    expect(window.location.search).toBe('?page=2');

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByTestId('product-page')).toHaveAttribute(
      'data-page-direction',
      'backward',
    );
    expect(window.location.search).toBe('');
  });

  it('shows an external fallback only for an out-of-range query', () => {
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
      />,
    );
    fireEvent.change(screen.getByLabelText('Search products'), {
      target: { value: 'zzqxvnotashoe' },
    });
    expect(screen.getByText('No shoes match these filters.')).toBeVisible();
    expect(
      screen.getByRole('link', {
        name: 'Search Decathlon for “zzqxvnotashoe”',
      }),
    ).toHaveAttribute('href', expect.stringContaining('decathlon.co.uk'));
  });

  it('responds to the shared locale-change event', async () => {
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        products={products}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('product-explorer')).toHaveAttribute(
        'data-hydrated',
        'true',
      ),
    );
    act(() => {
      window.dispatchEvent(
        new CustomEvent('rundecoded:locale-change', {
          detail: { locale: 'fr' },
        }),
      );
    });
    expect(
      await screen.findByRole('heading', { name: 'Explorer les chaussures' }),
    ).toBeVisible();
  });

  it('renders details from the simplified product record', () => {
    const adidasProducts = products.filter(
      ({ product }) => product.brand === 'Adidas',
    );
    expect(adidasProducts).toHaveLength(8);
    expect(products.every(({ product }) => product.details.overview.en)).toBe(
      true,
    );

    window.history.replaceState({}, '', '/en/catalogue/?q=Runblaze');
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        initialQuery="Runblaze"
        products={products}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Runblaze' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(
      'The Adidas Runblaze is designed for first runs',
    );
    expect(dialog).toHaveTextContent('274 g');
    expect(dialog).toHaveTextContent('10 mm');
    expect(dialog).toHaveTextContent('33 / 23 mm');
    expect(dialog).toHaveTextContent('Cloudfoam');
    expect(dialog).toHaveTextContent('Construction & ride');
    expect(dialog).toHaveTextContent('Ride character');
    expect(dialog).toHaveTextContent(
      'Lightly cushioned, straightforward and a little more responsive',
    );
    expect(dialog).toHaveTextContent('Stability & guidance');
    expect(dialog).toHaveTextContent('Abrasion-resistant Adiwear rubber');
    expect(dialog).toHaveTextContent('Strengths & limitations');
    expect(
      screen.getByRole('link', { name: 'View on Decathlon' }),
    ).toHaveAttribute(
      'href',
      'https://www.decathlon.it/p/scarpe-running-uomo-adidas-runblaze-nere/361354/c1m8929086',
    );
  });

  it('renders a complete migrated profile outside the Adidas range', () => {
    window.history.replaceState({}, '', '/en/catalogue/?q=Clifton+10');
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        initialQuery="Clifton 10"
        products={products}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clifton 10' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(
      "The Clifton 10 is HOKA's comfort-focused neutral daily trainer",
    );
    expect(dialog).toHaveTextContent('42 / 34 mm');
    expect(dialog).toHaveTextContent('Strengths & limitations');
  });
});
