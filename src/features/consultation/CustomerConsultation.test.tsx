import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getProductCatalogue } from '@/features/catalogue/catalogue';

import { CustomerConsultation } from './CustomerConsultation';

describe('customer consultation', () => {
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
      screen.getByRole('heading', { name: 'Strong matches' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Great matches' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Good alternatives' }),
    ).toBeVisible();
    expect(screen.getAllByText('Good alternative')).toHaveLength(5);
  });

  it('puts purpose-built gravel options ahead of ordinary road shoes', () => {
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

    expect(screen.getByText('Jogflow 190 Grip')).toBeVisible();
    expect(screen.getByText('Jogflow 190 Grip WP')).toBeVisible();
    expect(screen.getByText('Kipcore Gravel')).toBeVisible();
    expect(screen.getByText('Kipride Gravel')).toBeVisible();
    expect(screen.getByText('Aero Blaze 3 Grvl')).toBeVisible();
    expect(screen.getAllByText('Strong match')).toHaveLength(3);
    expect(screen.getAllByText('Great match')).toHaveLength(5);
  });
});
