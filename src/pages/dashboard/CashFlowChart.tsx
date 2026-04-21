import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { buildCashFlowSeries } from "../../data/accountingSelectors";
import type { JournalEntry } from "../journal-entries/journalEntriesData";
import { type CashFlowPoint, type DashboardTab } from "./dashboardData";

type Point = {
  x: number;
  y: number;
};

type ChartFrame = {
  baselineY: number;
  expenses: Point[];
  income: Point[];
  net: Point[];
};

type TooltipPosition = {
  left: number;
  top: number;
};

type CashFlowChartProps = {
  journalEntries: JournalEntry[];
  period: DashboardTab;
};

const chartWidth = 760;
const chartHeight = 320;
const padding = { bottom: 50, left: 60, right: 24, top: 22 };
const plotWidth = chartWidth - padding.left - padding.right;
const plotHeight = chartHeight - padding.top - padding.bottom;
const sampleCount = 48;
const morphDuration = 540;
const tooltipWidth = 228;
const tooltipHeight = 124;

const seriesMeta = [
  {
    color: "#16a34a",
    label: "Income",
    key: "income" as const,
  },
  {
    color: "#ef4444",
    label: "Expenses",
    key: "expenses" as const,
  },
  {
    color: "#445947",
    label: "Net Cash Flow",
    key: "net" as const,
  },
] satisfies { color: string; key: "income" | "expenses" | "net"; label: string }[];

function getNet(point: CashFlowPoint) {
  return point.income - point.expenses;
}

function getDomain(points: CashFlowPoint[]) {
  const maxAbs = points.reduce((max, point) => {
    return Math.max(max, Math.abs(point.income), Math.abs(point.expenses), Math.abs(getNet(point)));
  }, 0);

  if (maxAbs <= 20) return 20;
  if (maxAbs <= 40) return 40;
  if (maxAbs <= 80) return 80;
  if (maxAbs <= 120) return 120;
  if (maxAbs <= 200) return 200;
  if (maxAbs <= 400) return 400;
  return Math.ceil(maxAbs / 100) * 100;
}

function scaleY(value: number, domain: number) {
  const normalized = (value + domain) / (domain * 2);
  return padding.top + plotHeight - normalized * plotHeight;
}

function buildPoints(values: number[], domain: number): Point[] {
  const step = plotWidth / (values.length - 1);

  return values.map((value, index) => ({
    x: padding.left + step * index,
    y: scaleY(value, domain),
  }));
}

function interpolatePoint(from: Point, to: Point, progress: number): Point {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
}

function interpolateNumber(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getSegmentSlopes(points: Point[]) {
  return points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    return (next.y - point.y) / (next.x - point.x);
  });
}

function getMonotoneTangents(points: Point[]) {
  if (points.length < 2) {
    return [];
  }

  const slopes = getSegmentSlopes(points);
  const tangents = new Array(points.length).fill(0);

  tangents[0] = slopes[0];
  tangents[tangents.length - 1] = slopes[slopes.length - 1];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previousSlope = slopes[index - 1];
    const nextSlope = slopes[index];

    if (previousSlope === 0 || nextSlope === 0 || previousSlope * nextSlope <= 0) {
      tangents[index] = 0;
      continue;
    }

    const previousWidth = points[index].x - points[index - 1].x;
    const nextWidth = points[index + 1].x - points[index].x;
    const weight1 = 2 * nextWidth + previousWidth;
    const weight2 = nextWidth + 2 * previousWidth;

    tangents[index] = (weight1 + weight2) / (weight1 / previousSlope + weight2 / nextSlope);
  }

  for (let index = 0; index < slopes.length; index += 1) {
    const slope = slopes[index];

    if (slope === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      continue;
    }

    const normalizedCurrent = tangents[index] / slope;
    const normalizedNext = tangents[index + 1] / slope;
    const magnitude = Math.hypot(normalizedCurrent, normalizedNext);

    if (magnitude > 3) {
      const scale = 3 / magnitude;
      tangents[index] *= scale;
      tangents[index + 1] *= scale;
    }
  }

  return tangents;
}

function sampleMonotoneCurve(points: Point[], count: number) {
  if (points.length === 0) {
    return [];
  }

  if (points.length === 1) {
    return Array.from({ length: count }, () => ({ ...points[0] }));
  }

  const tangents = getMonotoneTangents(points);
  const startX = points[0].x;
  const endX = points[points.length - 1].x;
  const totalWidth = endX - startX;
  const segmentWidth = totalWidth / (points.length - 1);

  return Array.from({ length: count }, (_, index) => {
    const x = startX + (totalWidth * index) / (count - 1);
    const segmentPosition = (x - startX) / segmentWidth;
    const segmentIndex = Math.min(points.length - 2, Math.floor(segmentPosition));
    const localT = segmentPosition - segmentIndex;
    const current = points[segmentIndex];
    const next = points[segmentIndex + 1];
    const dx = next.x - current.x;
    const h00 = 2 * localT ** 3 - 3 * localT ** 2 + 1;
    const h10 = localT ** 3 - 2 * localT ** 2 + localT;
    const h01 = -2 * localT ** 3 + 3 * localT ** 2;
    const h11 = localT ** 3 - localT ** 2;
    const y =
      h00 * current.y +
      h10 * dx * tangents[segmentIndex] +
      h01 * next.y +
      h11 * dx * tangents[segmentIndex + 1];

    return { x, y };
  });
}

function buildCurvePath(points: Point[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  const tangents = getMonotoneTangents(points);

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const dx = next.x - current.x;
    const control1X = current.x + dx / 3;
    const control1Y = current.y + (tangents[index] * dx) / 3;
    const control2X = next.x - dx / 3;
    const control2Y = next.y - (tangents[index + 1] * dx) / 3;

    path += ` C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${next.x} ${next.y}`;
  }

  return path;
}

function buildAreaPath(points: Point[], baselineY: number) {
  if (points.length === 0) {
    return "";
  }

  const line = buildCurvePath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  return `${line} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;
}

function formatTick(value: number) {
  const peso = "\u20B1";
  const absolute = Math.abs(value);
  return value < 0 ? `-${peso}${absolute}k` : `${peso}${absolute}k`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function buildChartFrame(data: CashFlowPoint[]): ChartFrame {
  const domain = getDomain(data);
  const incomePoints = buildPoints(data.map((point) => point.income), domain);
  const expensesPoints = buildPoints(data.map((point) => point.expenses), domain);
  const netPoints = buildPoints(data.map((point) => getNet(point)), domain);

  return {
    baselineY: scaleY(0, domain),
    expenses: sampleMonotoneCurve(expensesPoints, sampleCount),
    income: sampleMonotoneCurve(incomePoints, sampleCount),
    net: sampleMonotoneCurve(netPoints, sampleCount),
  };
}

function interpolateFrame(from: ChartFrame, to: ChartFrame, progress: number): ChartFrame {
  return {
    baselineY: interpolateNumber(from.baselineY, to.baselineY, progress),
    expenses: from.expenses.map((point, index) => interpolatePoint(point, to.expenses[index], progress)),
    income: from.income.map((point, index) => interpolatePoint(point, to.income[index], progress)),
    net: from.net.map((point, index) => interpolatePoint(point, to.net[index], progress)),
  };
}

export function CashFlowChart({ journalEntries, period }: CashFlowChartProps) {
  const periodData = useMemo(() => buildCashFlowSeries(journalEntries, period, { allowFallback: false }), [journalEntries, period]);
  const targetFrame = useMemo(() => buildChartFrame(periodData), [periodData]);
  const [frame, setFrame] = useState<ChartFrame>(() => targetFrame);
  const frameRef = useRef<ChartFrame>(frame);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const hasMountedRef = useRef(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const domain = getDomain(periodData);
  const yTicks = [domain, domain / 2, 0, -domain / 2, -domain];
  const dataIncomePoints = buildPoints(periodData.map((point) => point.income), domain);
  const dataExpensesPoints = buildPoints(periodData.map((point) => point.expenses), domain);
  const dataNetPoints = buildPoints(periodData.map((point) => getNet(point)), domain);
  const hoveredPoint = hoveredIndex !== null ? periodData[hoveredIndex] : null;
  const hoveredIncomePoint = hoveredIndex !== null ? dataIncomePoints[hoveredIndex] : null;
  const hoveredExpensesPoint = hoveredIndex !== null ? dataExpensesPoints[hoveredIndex] : null;
  const hoveredNetPoint = hoveredIndex !== null ? dataNetPoints[hoveredIndex] : null;

  useEffect(() => {
    setHoveredIndex(null);
    setTooltipPosition(null);

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      frameRef.current = targetFrame;
      setFrame(targetFrame);
      return;
    }

    const from = frameRef.current;
    const to = targetFrame;
    const startTime = performance.now();

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startTime) / morphDuration);
      const nextFrame = interpolateFrame(from, to, progress);

      frameRef.current = nextFrame;
      setFrame(nextFrame);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetFrame]);

  const handlePointerMove = (event: ReactPointerEvent<SVGRectElement>) => {
    const svg = svgRef.current;

    if (!svg || periodData.length === 0) {
      return;
    }

    const rect = svg.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    const effectiveTooltipWidth = Math.min(tooltipWidth, Math.max(160, rect.width - 24));
    const effectiveTooltipHeight = Math.min(tooltipHeight, Math.max(108, rect.height - 24));
    const localX = ((event.clientX - rect.left) / rect.width) * chartWidth;
    const step = plotWidth / (periodData.length - 1);
    const index = clamp(Math.round((localX - padding.left) / step), 0, periodData.length - 1);
    const point = dataIncomePoints[index];
    const screenX = (point.x / chartWidth) * rect.width;
    const screenY = (point.y / chartHeight) * rect.height;
    const placeTooltipLeft = screenX < rect.width * 0.58;
    const minLeft = 14;
    const maxLeft = Math.max(minLeft, rect.width - effectiveTooltipWidth - 14);
    const preferredLeft = placeTooltipLeft ? screenX + 14 : screenX - effectiveTooltipWidth - 14;
    const left = clamp(preferredLeft, minLeft, maxLeft);
    const topLimit = Math.max(14, rect.height - effectiveTooltipHeight - 14);
    const top = clamp(screenY - effectiveTooltipHeight / 2, 14, topLimit);

    setHoveredIndex(index);
    setTooltipPosition({ left, top });
  };

  const clearHover = () => {
    setHoveredIndex(null);
    setTooltipPosition(null);
  };

  return (
    <section className="dashboard-panel dashboard-panel--chart" aria-labelledby="cash-flow-overview">
      <div className="dashboard-panel__header">
        <h2 id="cash-flow-overview">Cash Flow Overview</h2>
      </div>

      {journalEntries.length ? (
        <div className="dashboard-chart__stage">
          <svg
            ref={svgRef}
            aria-label={`Cash flow overview chart for ${period.toLowerCase()}`}
            className="dashboard-chart"
          role="img"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          {yTicks.map((tick) => {
            const y = scaleY(tick, domain);
            return (
              <g key={tick}>
                <line className="dashboard-chart__grid" x1={padding.left} x2={chartWidth - padding.right} y1={y} y2={y} />
                <text className="dashboard-chart__axisLabel dashboard-chart__axisLabel--y" x="8" y={y + 4}>
                  {formatTick(tick)}
                </text>
              </g>
            );
          })}

          {periodData.map((point, index) => {
            const step = plotWidth / (periodData.length - 1);
            const x = padding.left + step * index;

            return (
              <g key={point.label}>
                <line className="dashboard-chart__grid dashboard-chart__grid--vertical" x1={x} x2={x} y1={padding.top} y2={chartHeight - padding.bottom} />
                <text className="dashboard-chart__axisLabel dashboard-chart__axisLabel--x" x={x} y={chartHeight - 14}>
                  {point.label}
                </text>
              </g>
            );
          })}

          {hoveredPoint && hoveredIncomePoint && hoveredExpensesPoint && hoveredNetPoint ? (
            <>
              <line
                className="dashboard-chart__hoverLine"
                x1={hoveredIncomePoint.x}
                x2={hoveredIncomePoint.x}
                y1={padding.top}
                y2={chartHeight - padding.bottom}
              />
              <circle
                className="dashboard-chart__hoverPoint dashboard-chart__hoverPoint--income"
                cx={hoveredIncomePoint.x}
                cy={hoveredIncomePoint.y}
                r={4.5}
              />
              <circle
                className="dashboard-chart__hoverPoint dashboard-chart__hoverPoint--expenses"
                cx={hoveredExpensesPoint.x}
                cy={hoveredExpensesPoint.y}
                r={4.5}
              />
              <circle
                className="dashboard-chart__hoverPoint dashboard-chart__hoverPoint--net"
                cx={hoveredNetPoint.x}
                cy={hoveredNetPoint.y}
                r={4.5}
              />
            </>
          ) : null}

          <path className="dashboard-chart__area" d={buildAreaPath(frame.net, frame.baselineY)} />
          <path className="dashboard-chart__line dashboard-chart__line--income" d={buildCurvePath(frame.income)} />
          <path className="dashboard-chart__line dashboard-chart__line--expenses" d={buildCurvePath(frame.expenses)} />
          <path className="dashboard-chart__line dashboard-chart__line--net" d={buildCurvePath(frame.net)} />

          <rect
            className="dashboard-chart__hitArea"
            fill="transparent"
            height={chartHeight}
            onPointerLeave={clearHover}
            onPointerMove={handlePointerMove}
            pointerEvents="all"
            width={chartWidth}
            x={0}
            y={0}
          />
          </svg>

          {hoveredPoint && tooltipPosition ? (
            <div className="dashboard-chart__tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}>
              <div className="dashboard-chart__tooltipTitle">{hoveredPoint.label}</div>
              <div className="dashboard-chart__tooltipRow dashboard-chart__tooltipRow--income">
                <span className="dashboard-chart__tooltipLabel">Income</span>
                <span>:</span>
                <span className="dashboard-chart__tooltipValue">{formatCurrency(hoveredPoint.income)}</span>
              </div>
              <div className="dashboard-chart__tooltipRow dashboard-chart__tooltipRow--expenses">
                <span className="dashboard-chart__tooltipLabel">Expenses</span>
                <span>:</span>
                <span className="dashboard-chart__tooltipValue">{formatCurrency(hoveredPoint.expenses)}</span>
              </div>
              <div className="dashboard-chart__tooltipRow dashboard-chart__tooltipRow--net">
                <span className="dashboard-chart__tooltipLabel">Net Cash Flow</span>
                <span>:</span>
                <span className="dashboard-chart__tooltipValue">{formatCurrency(getNet(hoveredPoint))}</span>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="dashboard-emptyState dashboard-emptyState--chart">
          <p className="dashboard-emptyState__title">No matching cash flow data</p>
          <p className="dashboard-emptyState__text">Try widening the filters to see the chart.</p>
        </div>
      )}

      <div className="dashboard-legend" aria-label="Chart legend">
        {seriesMeta.map((entry) => (
          <div key={entry.label} className="dashboard-legend__item">
            <span className="dashboard-legend__swatch" style={{ backgroundColor: entry.color }} aria-hidden="true" />
            <span>{entry.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
