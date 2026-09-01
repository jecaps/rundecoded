import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ProductExplorer } from './ProductExplorer';
import { getProductSlice } from './slice';

const products = getProductSlice();

afterEach(cleanup);

describe('ProductExplorer', () => {
  it('renders the 12-product slice without card prices or weights', () => {
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
    expect(screen.getAllByTestId('product-card')).toHaveLength(1);
    expect(screen.getByText('1 of 12 shoes')).toBeVisible();
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
