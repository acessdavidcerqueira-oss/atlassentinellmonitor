import { cn } from "@/lib/utils";

type ChartDatum = Record<string, string | number | undefined>;

interface SeriesConfig {
  key: string;
  label: string;
  color: string;
  fill?: string;
}

const svgWidth = 640;
const svgHeight = 260;
const padding = {
  top: 16,
  right: 20,
  bottom: 28,
  left: 34
};

export function LightweightAreaChart({
  data,
  xKey,
  series,
  className
}: {
  data: ChartDatum[];
  xKey: string;
  series: SeriesConfig[];
  className?: string;
}) {
  if (!data.length) return <EmptyChartFrame />;

  const maxValue = Math.max(1, ...data.flatMap((item) => series.map((entry) => valueOf(item, entry.key))));
  const baseY = svgHeight - padding.bottom;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="min-h-0 flex-1 overflow-visible">
        <GridLines maxValue={maxValue} />
        {series.map((entry) => {
          const points = pointsForSeries(data, entry.key, maxValue);
          const path = linePath(points);
          const areaPath = `${path} L ${points[points.length - 1]?.x ?? padding.left} ${baseY} L ${
            points[0]?.x ?? padding.left
          } ${baseY} Z`;

          return (
            <g key={entry.key}>
              {entry.fill ? <path d={areaPath} fill={entry.fill} opacity={0.45} /> : null}
              <path d={path} fill="none" stroke={entry.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
      </svg>
      <ChartFooter data={data} xKey={xKey} series={series} />
    </div>
  );
}

export function LightweightStackedBars({
  data,
  xKey,
  series
}: {
  data: ChartDatum[];
  xKey: string;
  series: SeriesConfig[];
}) {
  if (!data.length) return <EmptyChartFrame />;

  return (
    <div className="flex h-full flex-col justify-end gap-3">
      {data.slice(-8).map((item) => {
        const total = Math.max(1, series.reduce((sum, entry) => sum + valueOf(item, entry.key), 0));
        return (
          <div key={String(item[xKey])} className="grid grid-cols-[72px_1fr] items-center gap-3 text-xs text-atlas-muted">
            <span className="truncate">{String(item[xKey])}</span>
            <div className="flex h-5 overflow-hidden rounded-full bg-white/8">
              {series.map((entry) => (
                <span
                  key={entry.key}
                  className="h-full"
                  title={`${entry.label}: ${valueOf(item, entry.key)}`}
                  style={{
                    width: `${(valueOf(item, entry.key) / total) * 100}%`,
                    backgroundColor: entry.color
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
      <Legend series={series} />
    </div>
  );
}

export function LightweightBarList({
  data,
  color = "#48CFF2"
}: {
  data: Array<{ name: string; value: number }>;
  color?: string;
}) {
  if (!data.length) return <EmptyChartFrame />;

  const maxValue = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {data.map((item) => (
        <div key={item.name} className="grid grid-cols-[112px_1fr_36px] items-center gap-3 text-xs">
          <span className="truncate text-atlas-muted">{item.name}</span>
          <div className="h-3 rounded-full bg-white/8">
            <div
              className="h-3 rounded-full"
              style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-right font-medium text-atlas-text">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function LightweightDonut({
  data,
  palette
}: {
  data: Array<{ name: string; value: number }>;
  palette: string[];
}) {
  if (!data.length) return <EmptyChartFrame />;

  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  let cursor = 0;
  const gradient = data
    .map((item, index) => {
      const start = cursor;
      const end = cursor + (item.value / total) * 100;
      cursor = end;
      const color = palette[index % palette.length];
      return `${color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="grid h-full items-center gap-5 md:grid-cols-[170px_1fr]">
      <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-atlas-card text-center">
          <span className="font-display text-2xl font-semibold text-atlas-text">{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-atlas-muted">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="font-medium text-atlas-text">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LightweightScatter({
  data
}: {
  data: Array<{ name: string; x: number; y: number; size: number }>;
}) {
  if (!data.length) return <EmptyChartFrame />;

  const maxX = Math.max(1, ...data.map((item) => item.x));
  const maxY = Math.max(1, ...data.map((item) => item.y));
  const maxSize = Math.max(1, ...data.map((item) => item.size));

  return (
    <div className="relative h-full rounded-md border border-atlas-border bg-[linear-gradient(rgba(216,247,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(216,247,255,0.05)_1px,transparent_1px)] bg-[length:56px_56px]">
      <span className="absolute bottom-2 left-3 text-xs text-atlas-muted">Crescimento</span>
      <span className="absolute right-3 top-2 text-xs text-atlas-muted">Risco</span>
      {data.map((item) => {
        const size = 18 + (item.size / maxSize) * 42;
        return (
          <div
            key={item.name}
            className="absolute rounded-full border border-cyan-200/50 bg-cyan-300/25 shadow-[0_0_20px_rgba(72,207,242,0.24)]"
            title={`${item.name}: crescimento ${item.x}, risco ${item.y}`}
            style={{
              left: `${Math.min(92, Math.max(5, (item.x / maxX) * 88))}%`,
              bottom: `${Math.min(86, Math.max(10, (item.y / maxY) * 78))}%`,
              width: size,
              height: size,
              transform: "translate(-50%, 50%)"
            }}
          />
        );
      })}
    </div>
  );
}

function GridLines({ maxValue }: { maxValue: number }) {
  return (
    <g>
      {[0, 0.25, 0.5, 0.75, 1].map((step) => {
        const y = padding.top + (svgHeight - padding.top - padding.bottom) * step;
        return (
          <g key={step}>
            <line x1={padding.left} x2={svgWidth - padding.right} y1={y} y2={y} stroke="rgba(180,229,255,0.12)" />
            <text x="6" y={y + 4} fill="#8FA9BE" fontSize="11">
              {Math.round(maxValue * (1 - step))}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function ChartFooter({ data, xKey, series }: { data: ChartDatum[]; xKey: string; series: SeriesConfig[] }) {
  const labels = [data[0]?.[xKey], data[Math.floor(data.length / 2)]?.[xKey], data[data.length - 1]?.[xKey]].filter(Boolean);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-atlas-muted">
        {labels.map((label) => (
          <span key={String(label)}>{String(label)}</span>
        ))}
      </div>
      <Legend series={series} />
    </div>
  );
}

function Legend({ series }: { series: SeriesConfig[] }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-atlas-muted">
      {series.map((entry) => (
        <span key={entry.key} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.label}
        </span>
      ))}
    </div>
  );
}

function EmptyChartFrame() {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-atlas-border text-sm text-atlas-muted">
      Nenhum report registrado
    </div>
  );
}

function pointsForSeries(data: ChartDatum[], key: string, maxValue: number) {
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;
  const lastIndex = Math.max(1, data.length - 1);

  return data.map((item, index) => ({
    x: padding.left + (index / lastIndex) * chartWidth,
    y: padding.top + chartHeight - (valueOf(item, key) / maxValue) * chartHeight
  }));
}

function linePath(points: Array<{ x: number; y: number }>): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function valueOf(item: ChartDatum, key: string): number {
  const value = item[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
