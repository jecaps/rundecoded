import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getProductCatalogue } from '@/features/catalogue/catalogue';

import { CustomerConsultation } from './CustomerConsultation';

afterEach(cleanup);
beforeEach(() => {
  window.history.replaceState({}, '', '/en/consultation/');
});

describe('customer consultation', () => {
  it('uses compact progress without questionnaire card blocks', () => {
    const { container } = render(
      <CustomerConsultation
        assetBase="/rundecoded/"
        locale="en"
        products={getProductCatalogue().map(({ product }) => product)}
      />,
    );

    expect(screen.getByText('Distance')).toBeVisible();
    expect(
      screen.getByRole('progressbar', { name: 'Step 1 of 7' }),
    ).toHaveAttribute('aria-valuenow', '1');
    const catalogueLink = screen.getByRole('link', {
      name: 'Browse shoe catalogue',
    });
    expect(catalogueLink).toHaveAttribute('href', '/en/catalogue/');
    expect(catalogueLink.querySelector('svg')).toBeNull();
    expect(
      screen.queryByRole('link', { name: 'Back to catalogue' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(container.querySelector('[data-slot="card"]')).toBeNull();
  });

  it('allows up to two priorities and keeps the neutral answer exclusive', () => {
    render(
      <CustomerConsultation
        assetBase="/rundecoded/"
        locale="en"
        products={getProductCatalogue().map(({ product }) => product)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Not sure yet/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: /^Other \/ not sure/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    const value = screen.getByRole('button', {
      name: /^Value/,
    });
    const comfort = screen.getByRole('button', { name: /^Comfort/ });
    const speed = screen.getByRole('button', { name: /^Speed/ });
    fireEvent.click(value);
    fireEvent.click(comfort);
    fireEvent.click(speed);

    expect(value).toHaveAttribute('aria-pressed', 'true');
    expect(comfort).toHaveAttribute('aria-pressed', 'true');
    expect(speed).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: /Not sure yet/ }));
    expect(value).toHaveAttribute('aria-pressed', 'false');
    expect(comfort).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps unknown answers neutral and supports an optional other surface note', () => {
    render(
      <CustomerConsultation
        assetBase="/rundecoded/"
        locale="en"
        products={getProductCatalogue().map(({ product }) => product)}
      />,
    );

    expect(screen.getByRole('button', { name: /^21–42 km/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /^Over 42 km/ })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /Not sure yet/ }));
    expect(screen.getByText(/will not exclude a shoe/i)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    const road = screen.getByRole('button', { name: /^Road/ });
    fireEvent.click(road);
    fireEvent.click(screen.getByRole('button', { name: /^Other \/ not sure/ }));
    expect(screen.getByLabelText(/Describe the other surface/)).toBeVisible();
    expect(road).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(road);
    expect(road).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    fireEvent.click(screen.getByRole('button', { name: /Not sure yet/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: /^Other \/ not sure/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(
      screen.getByRole('button', { name: /^No preference \/ not sure/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(
      screen.getByRole('button', { name: /^Prefer not to say \/ not sure/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      screen.getByRole('heading', { name: 'Review the customer’s answers' }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: 'Show recommendations' }),
    );

    expect(screen.getByTestId('consultation-results')).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Best options for this customer' }),
    ).toBeVisible();
    expect(
      screen.getAllByRole('button', { name: /View details/ }),
    ).toHaveLength(5);
    expect(screen.getAllByText('Good alternative')).toHaveLength(5);
    fireEvent.click(
      screen.getByRole('button', { name: 'Show more recommendations' }),
    );
    expect(
      screen.getAllByRole('button', { name: /View details/ }),
    ).toHaveLength(10);
    expect(screen.queryByText('Why this shoe')).not.toBeInTheDocument();

    expect(new URL(window.location.href).searchParams.get('results')).toBe('1');
    cleanup();
    render(
      <CustomerConsultation
        assetBase="/rundecoded/"
        locale="en"
        products={getProductCatalogue().map(({ product }) => product)}
      />,
    );
    expect(screen.getByTestId('consultation-results')).toBeVisible();
    expect(
      screen.getAllByRole('button', { name: /View details/ }),
    ).toHaveLength(5);
  });

  it('reveals focused trail and track choices only when their group is selected', () => {
    render(
      <CustomerConsultation
        assetBase="/rundecoded/"
        locale="en"
        products={getProductCatalogue().map(({ product }) => product)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Under 5 km/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      screen.queryByRole('button', { name: /^Mixed terrain/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Trail \/ off-road/ }));
    expect(screen.getByRole('button', { name: /^Easy terrain/ })).toBeVisible();
    const mixedTerrain = screen.getByRole('button', {
      name: /^Mixed terrain/,
    });
    fireEvent.click(mixedTerrain);
    expect(mixedTerrain).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /^Trail \/ off-road/ }),
    ).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(
      screen.getByRole('button', { name: /^Track or cross-country/ }),
    );
    expect(
      screen.getByRole('button', { name: /^Track(?! or cross-country)/ }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: /^Cross-country/ }),
    ).toBeVisible();
  });

  it('ranks short-distance beginner road-and-gravel options first', async () => {
    render(
      <CustomerConsultation
        assetBase="/rundecoded/"
        locale="en"
        products={getProductCatalogue().map(({ product }) => product)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Under 5 km/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: /^Road/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Parks & gravel/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: /Not sure yet/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: /^Start running/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: /^No preference/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(
      screen.getByRole('button', { name: /^No current concern/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Show recommendations' }),
    );

    expect(screen.getByText('Jogflow 100.1')).toBeVisible();
    expect(screen.getByText('Jogflow 190 Grip')).toBeVisible();
    expect(screen.getByText('Jogflow 190 Premium')).toBeVisible();
    expect(screen.getByText('Jogflow 190 Grip WP')).toBeVisible();
    expect(screen.getByText('Ellipse')).toBeVisible();
    expect(
      screen.getAllByRole('button', { name: /View details/ }),
    ).toHaveLength(5);
    const detailsButton = screen.getAllByRole('button', {
      name: /View details/,
    })[0];
    const recommendationUrl = window.location.href;
    fireEvent.click(detailsButton);
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Jogflow 100.1' }),
    ).toBeVisible();
    expect(within(dialog).getByText('Construction & ride')).toBeVisible();
    expect(window.location.href).toBe(recommendationUrl);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(detailsButton).toHaveFocus());
    fireEvent.click(
      screen.getByRole('button', { name: 'Show more recommendations' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Show more recommendations' }),
    );

    const strongMatches = screen.getAllByText('Strong match');
    const greatMatches = screen.getAllByText('Great match');
    const alternatives = screen.getAllByText('Good alternative');
    expect(strongMatches).toHaveLength(10);
    expect(greatMatches).toHaveLength(4);
    expect(alternatives).toHaveLength(1);
    expect(strongMatches[0]).toHaveClass('bg-emerald-100', 'text-emerald-800');
    expect(greatMatches[0]).toHaveClass('bg-blue-100', 'text-blue-800');
    expect(alternatives[0]).toHaveClass('bg-slate-100', 'text-slate-700');
    expect(screen.getAllByText('Why this shoe').length).toBeGreaterThan(0);
    expect(screen.queryByText('Keep in mind')).not.toBeInTheDocument();
  });
});
