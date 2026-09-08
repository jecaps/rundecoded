import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ProductExplorer } from './ProductExplorer';
import { getProductCatalogue } from './catalogue';

const products = getProductCatalogue();

afterEach(cleanup);

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
      'line-clamp-2',
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

    expect(screen.getAllByRole('button', { name: 'Selected' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /^Deselect / })).toHaveLength(
      2,
    );
    const selectionTray = screen.getByRole('region', {
      name: 'Shoe comparison selection',
    });
    expect(selectionTray).toBeVisible();
    expect(selectionTray).toHaveClass('flex', 'flex-col', 'items-center');
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
    expect(screen.getAllByRole('button', { name: 'Selected' })).toHaveLength(1);
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
    fireEvent.click(
      screen.getByRole('button', { name: 'Compare selected (2/2)' }),
    );

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
      expect(
        screen.queryAllByRole('button', { name: 'Selected' }),
      ).toHaveLength(0);
    });
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

  it('maps every available primary prototype profile by exact product ID', () => {
    const adidasProducts = products.filter(
      ({ product }) => product.brand.id === 'adidas',
    );
    expect(adidasProducts).toHaveLength(8);
    expect(adidasProducts.every(({ details }) => details !== null)).toBe(true);
    expect(products.filter(({ details }) => details !== null)).toHaveLength(97);
    expect(
      products.find(
        ({ product }) => product.id === 'decathlon-jogflow-190-grip',
      )?.details?.provenance.status,
    ).toBe('verified');
    expect(
      products.find(({ product }) => product.id === 'hoka-clifton-10')?.details,
    ).not.toBeNull();
    expect(
      products.find(({ product }) => product.id === 'kiprun-kipride-support')
        ?.details,
    ).toBeNull();

    window.history.replaceState({}, '', '/en/catalogue/?q=Runblaze');
    render(
      <ProductExplorer
        assetBase="/rundecoded/"
        initialLocale="en"
        initialQuery="Runblaze"
        products={products}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(
      'The Adidas Runblaze is designed for first runs',
    );
    expect(dialog).toHaveTextContent('278 g');
    expect(dialog).toHaveTextContent('Cloudfoam midsole');
    expect(dialog).toHaveTextContent('Strengths & limitations');
    expect(dialog).toHaveTextContent(
      'Migrated from the original RunDecoded prototype',
    );
    expect(
      screen.getByRole('link', { name: 'View on Decathlon' }),
    ).toHaveAttribute(
      'href',
      'https://www.decathlon.it/p/scarpe-running-uomo-adidas-runblaze-nere/_/R-p-361354',
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
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(
      "The Clifton 10 is HOKA's comfort-focused neutral daily trainer",
    );
    expect(dialog).toHaveTextContent('Active Foot Frame');
    expect(dialog).toHaveTextContent('42/34 mm');
    expect(dialog).toHaveTextContent('Strengths & limitations');
  });
});
