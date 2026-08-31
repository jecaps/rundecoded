import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RoutePlaceholder } from './RoutePlaceholder';

describe('RoutePlaceholder', () => {
  it('renders a labelled route heading and its supporting copy', () => {
    render(
      <RoutePlaceholder
        description="Browse the future product catalogue."
        eyebrow="Application foundation"
        note="Product features arrive in a later phase."
        title="Catalogue"
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Catalogue' }),
    ).toHaveAttribute('id', 'route-title');
    expect(screen.getByText('Application foundation')).toBeInTheDocument();
    expect(
      screen.getByText('Browse the future product catalogue.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Product features arrive in a later phase.'),
    ).toBeInTheDocument();
  });
});
