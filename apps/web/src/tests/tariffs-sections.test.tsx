import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  ChargeWindowsSection,
  DeviceScheduleSection,
  FeedInSection,
  InsightsSection,
  MonthlyCostSection,
  PriceDistributionSection,
  PriceHeatmapSection,
  PriceTimelineSection,
  ProviderInfoSection,
  TariffHeaderActions,
  TariffKpiCards,
  TariffStatusBar,
} from '../components/tariffs';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('recharts', () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const Null = () => null;
  return {
    ResponsiveContainer: Pass,
    BarChart: Pass,
    AreaChart: Pass,
    Area: Null,
    Bar: Null,
    Cell: Null,
    CartesianGrid: Null,
    ReferenceLine: Null,
    Tooltip: Null,
    XAxis: Null,
    YAxis: Null,
  };
});

/** Render, assert non-empty output, unmount. */
function mount(node: React.ReactElement) {
  const { container, unmount } = render(node);
  expect(container.textContent?.length ?? 0).toBeGreaterThan(0);
  unmount();
}

describe('tariffs sections — both/all branch variants', () => {
  it('TariffHeaderActions covers every provider and price-zone branch', () => {
    mount(
      <TariffHeaderActions
        tariffProvider="tibber"
        providerLabel="Tibber"
        priceZone="low"
        currentPrice={0.1}
      />,
    );
    mount(
      <TariffHeaderActions
        tariffProvider="awattar"
        providerLabel="aWATTar"
        priceZone="mid"
        currentPrice={0.18}
      />,
    );
    mount(
      <TariffHeaderActions
        tariffProvider="none"
        providerLabel="settings.none"
        priceZone="high"
        currentPrice={0.5}
      />,
    );
  });

  it('TariffStatusBar covers good and high price states', () => {
    mount(<TariffStatusBar currentPrice={0.1} isGoodPrice={true} />);
    mount(<TariffStatusBar currentPrice={0.5} isGoodPrice={false} />);
  });

  it('TariffKpiCards covers good and high price states', () => {
    mount(<TariffKpiCards currentPrice={0.1} isGoodPrice={true} feedInTariff={0.082} />);
    mount(<TariffKpiCards currentPrice={0.5} isGoodPrice={false} feedInTariff={0.082} />);
  });

  it('PriceTimelineSection covers the price and renewable chart branches', () => {
    mount(<PriceTimelineSection view48h="price" onView48h={vi.fn()} chargeThreshold={0.15} />);
    mount(<PriceTimelineSection view48h="renewable" onView48h={vi.fn()} chargeThreshold={0.15} />);
  });

  it('ChargeWindowsSection covers expanded and collapsed states', () => {
    mount(<ChargeWindowsSection expandedWindow={0} onExpandedWindow={vi.fn()} />);
    mount(<ChargeWindowsSection expandedWindow={null} onExpandedWindow={vi.fn()} />);
  });

  it('MonthlyCostSection covers the three budget-gauge colour branches', () => {
    mount(<MonthlyCostSection monthlyBudget={80} monthlyBudgetPct={95} />); // > 90
    mount(<MonthlyCostSection monthlyBudget={80} monthlyBudgetPct={80} />); // 70–90
    mount(<MonthlyCostSection monthlyBudget={80} monthlyBudgetPct={30} />); // < 70
  });

  it('ProviderInfoSection covers alerts-on and alerts-off states', () => {
    mount(
      <ProviderInfoSection
        providerLabel="Tibber"
        chargeThreshold={0.15}
        priceAlerts={true}
        priceAlertThreshold={0.1}
      />,
    );
    mount(
      <ProviderInfoSection
        providerLabel="settings.none"
        chargeThreshold={0.15}
        priceAlerts={false}
        priceAlertThreshold={0.1}
      />,
    );
  });

  it('FeedInSection renders feed-in revenue figures', () => {
    mount(<FeedInSection feedInTariff={0.082} pvYieldToday={12.5} />);
  });

  it('renders the propless data-driven sections', () => {
    mount(<PriceHeatmapSection />);
    mount(<DeviceScheduleSection />);
    mount(<PriceDistributionSection />);
    mount(<InsightsSection />);
  });
});
