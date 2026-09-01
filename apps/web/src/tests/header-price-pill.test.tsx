import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { AppShellHeaderPricePill } from '../components/layout/AppShellHeaderTickerPills';

describe('AppShellHeaderPricePill', () => {
  it('displays €/kWh values as cent/kWh for the mobile pill', () => {
    render(<AppShellHeaderPricePill priceCurrent={0.128} />);
    expect(screen.getByText('12.8 ct')).toBeInTheDocument();
  });
});
