import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { getProductCatalogue } from '@/features/catalogue/catalogue';

import { CustomerConsultation } from './CustomerConsultation';

afterEach(cleanup);

describe('customer consultation', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /Not sure yet/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    const value = screen.getByRole('button', {
      name: /^Value \/ simple first shoe/,
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
    expect(screen.getByRole('button', { name: /^42–60 km/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /^Over 60 km/ })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /Not sure yet/ }));
    expect(screen.getByText(/will not exclude a shoe/i)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    const road = screen.getByRole('button', { name: /^Road/ });
    fireEvent.click(road);
    fireEvent.click(screen.getByRole('button', { name: /Other surface/ }));
    expect(screen.getByLabelText(/Describe the other surface/)).toBeVisible();
    expect(road).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Not sure yet/ }));
    expect(road).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    for (let index = 0; index < 4; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: /Not sure yet/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    }

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
      screen.getAllByRole('link', { name: /View in catalogue/ }),
    ).toHaveLength(5);
    expect(screen.getAllByText('Good alternative')).toHaveLength(5);
    fireEvent.click(
      screen.getByRole('button', { name: 'Show more recommendations' }),
    );
    expect(
      screen.getAllByRole('link', { name: /View in catalogue/ }),
    ).toHaveLength(10);
    expect(screen.queryByText('Why this shoe')).not.toBeInTheDocument();
  });

  it('ranks short-distance beginner road-and-gravel options first', () => {
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
      screen.getAllByRole('link', { name: /View in catalogue/ }),
    ).toHaveLength(5);
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
