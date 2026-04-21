import { useMemo, useState } from "react";
import { buildExpenseSlices } from "../../data/accountingSelectors";
import type { JournalEntry } from "../journal-entries/journalEntriesData";

const chartSize = 260;
const radius = 78;
const strokeWidth = 34;
const center = chartSize / 2;
const circumference = 2 * Math.PI * radius;

type ExpenseBreakdownProps = {
  journalEntries: JournalEntry[];
};

export function ExpenseBreakdown({ journalEntries }: ExpenseBreakdownProps) {
  const expenseSlices = useMemo(() => buildExpenseSlices(journalEntries, { allowFallback: false }), [journalEntries]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  let offset = 0;
  const hoveredSlice = hoveredIndex !== null ? expenseSlices[hoveredIndex] : null;
  const total = expenseSlices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <section className="dashboard-panel dashboard-panel--breakdown" aria-labelledby="expense-breakdown">
      <div className="dashboard-panel__header">
        <h2 id="expense-breakdown">Expense Breakdown</h2>
      </div>

      {expenseSlices.length ? (
        <div className="dashboard-breakdown">
          <div className="dashboard-breakdown__visual">
            <svg
              aria-label="Expense breakdown donut chart"
              className="dashboard-donut"
              role="img"
              viewBox={`0 0 ${chartSize} ${chartSize}`}
            >
              <circle
                className="dashboard-donut__track"
                cx={center}
                cy={center}
                r={radius}
                strokeWidth={strokeWidth}
              />

              {expenseSlices.map((slice, index) => {
                const sliceLength = (slice.value / total) * circumference;
                const currentOffset = offset;
                offset += sliceLength;
                const isActive = hoveredIndex === index;
                const isDimmed = hoveredIndex !== null && !isActive;

                return (
                  <circle
                    key={slice.label}
                    className={[
                      "dashboard-donut__segment",
                      isActive ? "dashboard-donut__segment--active" : "",
                      isDimmed ? "dashboard-donut__segment--dimmed" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    cx={center}
                    cy={center}
                    onPointerEnter={() => setHoveredIndex(index)}
                    onPointerLeave={() => setHoveredIndex(null)}
                    r={radius}
                    stroke={slice.color}
                    strokeDasharray={`${sliceLength} ${circumference - sliceLength}`}
                    strokeDashoffset={-currentOffset}
                    strokeWidth={isActive ? strokeWidth + 4 : strokeWidth}
                  />
                );
              })}

              <circle className="dashboard-donut__hole" cx={center} cy={center} r={radius - strokeWidth / 2 - 1} />
            </svg>

            {hoveredSlice ? (
              <div className="dashboard-breakdown__tooltip">
                <div className="dashboard-breakdown__tooltipHeader">
                  <span
                    className="dashboard-breakdown__tooltipSwatch"
                    style={{ backgroundColor: hoveredSlice.color }}
                    aria-hidden="true"
                  />
                  <span className="dashboard-breakdown__tooltipLabel">{hoveredSlice.label}</span>
                </div>
                <div className="dashboard-breakdown__tooltipValue">{hoveredSlice.value}%</div>
                <div className="dashboard-breakdown__tooltipMeta">of total expenses</div>
              </div>
            ) : null}
          </div>

          <div className="dashboard-breakdown__legend">
            {expenseSlices.map((slice, index) => {
              const isActive = hoveredIndex === index;
              const isDimmed = hoveredIndex !== null && !isActive;

              return (
                <button
                  key={slice.label}
                  aria-label={`${slice.label}: ${slice.value}% of total expenses`}
                  className={[
                    "dashboard-breakdown__item",
                    isActive ? "dashboard-breakdown__item--active" : "",
                    isDimmed ? "dashboard-breakdown__item--dimmed" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onBlur={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(index)}
                  onPointerEnter={() => setHoveredIndex(index)}
                  onPointerLeave={() => setHoveredIndex(null)}
                  type="button"
                >
                  <span className="dashboard-breakdown__swatch" style={{ backgroundColor: slice.color }} aria-hidden="true" />
                  <span>{slice.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="dashboard-emptyState">
          <p className="dashboard-emptyState__title">No matching expense data</p>
          <p className="dashboard-emptyState__text">Try widening the filters to see the breakdown.</p>
        </div>
      )}
    </section>
  );
}
