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
    expect(
      within(firstCard!).queryByText(/€|price|264 g/i),
    ).not.toBeInTheDocument();
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
});
