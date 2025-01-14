type Stat = [string, string, number, number];

interface MetricValue {
  latest: number;
  timeseries: number[];
  median: number | null;
  high: number | null;
  low: number | null;
}

interface Metric {
  [metric: string]: MetricValue;
}

interface StatsMap {
  [service: string]: Metric;
}

interface IStatsAggregator {
  statsMap: StatsMap;
  hasNewStats: boolean;
  turns: number;

  addStat(stat: Stat): void;
  getStats(): StatsMap | null;
}