export interface ChartSeries {
  name: string;
  type: "line" | "bar";
  x: (string | number)[];
  y: number[];
}

export interface ChartSpec {
  title: string;
  xTitle: string;
  yTitle: string;
  series: ChartSeries[];
}

export function chartHTML(spec: ChartSpec | null, opts?: { id?: string }): string;
export function formatValue(v: number): string;
export function humanizeLabel(raw: string): string;
