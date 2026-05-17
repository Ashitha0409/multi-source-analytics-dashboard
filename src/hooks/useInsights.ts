import { useMemo } from 'react';
import { useAnalytics } from './useAnalytics';
import { formatCurrency } from '../utils';

export interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'info';
  title: string;
  description: string;
}

export const useInsights = (): Insight[] => {
  const { kpis, categoryData, regionData, monthlyData } = useAnalytics();

  return useMemo(() => {
    const insights: Insight[] = [];

    // ── 1. Revenue Growth ─────────────────────────────────────
    if (kpis.revenueGrowth !== 0 && kpis.totalRevenue > 0) {
      const isUp = kpis.revenueGrowth > 0;
      insights.push({
        id: 'rev-growth',
        type: isUp ? 'positive' : 'negative',
        title: `Revenue ${isUp ? 'Up' : 'Down'} ${Math.abs(kpis.revenueGrowth)}%`,
        description: `Sales ${isUp ? 'grew' : 'dropped'} by ${Math.abs(kpis.revenueGrowth)}% vs the previous 90-day period.`,
      });
    }

    // ── 2. Top Category — only if it has actual revenue ───────
    const revenueCategories = categoryData.filter(c => c.value > 0 && c.name !== 'Uncategorized');
    if (revenueCategories.length > 0) {
      const top = [...revenueCategories].sort((a, b) => b.value - a.value)[0];
      insights.push({
        id: 'top-category',
        type: 'info',
        title: `Top Category: ${top.name}`,
        description: `${top.name} leads with ${formatCurrency(top.value)} in revenue — ${((top.value / revenueCategories.reduce((s, c) => s + c.value, 0)) * 100).toFixed(0)}% of total.`,
      });
    }

    // ── 3. Negative Profit Alert ──────────────────────────────
    if (kpis.totalProfit < 0) {
      insights.push({
        id: 'negative-profit',
        type: 'negative',
        title: 'Negative Profit Detected',
        description: `Total profit is ${formatCurrency(kpis.totalProfit)}. Some products may be selling below cost.`,
      });
    } else if (kpis.totalRevenue > 0 && kpis.totalProfit > 0) {
      const margin = (kpis.totalProfit / kpis.totalRevenue) * 100;
      if (margin < 10) {
        insights.push({
          id: 'low-margin',
          type: 'negative',
          title: 'Low Profit Margin',
          description: `Profit margin is only ${margin.toFixed(1)}%. Industry benchmark is typically 15–25%.`,
        });
      } else {
        insights.push({
          id: 'profit-margin',
          type: 'positive',
          title: `Profit Margin: ${margin.toFixed(1)}%`,
          description: `Healthy margin on ${formatCurrency(kpis.totalRevenue)} revenue, yielding ${formatCurrency(kpis.totalProfit)} profit.`,
        });
      }
    }

    // ── 4. Delayed Orders Alert ───────────────────────────────
    if (kpis.slowDeliveries > 0 && kpis.logisticsCount > 0) {
      const delayPct = ((kpis.slowDeliveries / kpis.logisticsCount) * 100).toFixed(0);
      insights.push({
        id: 'delayed-orders',
        type: kpis.slowDeliveries > 5 ? 'negative' : 'neutral',
        title: `${kpis.slowDeliveries} Slow Deliveries`,
        description: `${delayPct}% of shipments took more than 5 days. Avg delivery time is ${kpis.avgDeliveryTime} days.`,
      });
    }

    // ── 5. Peak Revenue Month ─────────────────────────────────
    const revenueMonths = monthlyData.filter(m => m.revenue > 0);
    if (revenueMonths.length > 0) {
      const peak = [...revenueMonths].sort((a, b) => b.revenue - a.revenue)[0];
      insights.push({
        id: 'peak-month',
        type: 'positive',
        title: `Peak: ${peak.month}`,
        description: `Highest revenue month was ${peak.month} with ${formatCurrency(peak.revenue)} in sales.`,
      });
    }

    // ── 6. Underperforming Region ─────────────────────────────
    const activeRegions = regionData.filter(r => r.current > 0);
    if (activeRegions.length > 1) {
      const lowest = [...activeRegions].sort((a, b) => a.current - b.current)[0];
      insights.push({
        id: 'lowest-region',
        type: 'neutral',
        title: `${lowest.name} Needs Attention`,
        description: `${lowest.name} has the lowest revenue at ${formatCurrency(lowest.current)} this quarter.`,
      });
    }

    // Return max 4 insights — most important first
    return insights.slice(0, 4);
  }, [kpis, categoryData, regionData, monthlyData]);
};
