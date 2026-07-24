'use client'

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

type ChangeItem = {
  class: string;
  changeIndex: number;
  changeDirection: 'up' | 'down';
  percentChange: string;
  sqkmChange: string;
};

type ChangeGroup = {
  label: string;
  changes: ChangeItem[];
};

type Props = {
  changeLog: ChangeGroup[];
};

const pivotChangeLog = (changeLog: ChangeGroup[]) => {
  const map = new Map<string, Map<number, ChangeItem>>();

  changeLog.forEach((group, groupIdx) => {
    group.changes.forEach((item) => {
      if (!map.has(item.class)) {
        map.set(item.class, new Map());
      }

      map.get(item.class)!.set(groupIdx, item);
    });
  });

  return map;
};

export const ChangeGrid: React.FC<Props> = ({ changeLog }) => {
  const pivot = pivotChangeLog(changeLog);

  const classes = Array.from(pivot.keys()).sort();

  const hasSummary = changeLog.length > 1;

  const visibleGroups = hasSummary
    ? changeLog.slice(0, -1)
    : [];

  const summaryGroupIdx = hasSummary
    ? changeLog.length - 1
    : 0;

  const columnCount = hasSummary
    ? visibleGroups.length + 1
    : 1;

  return (
    <div className="w-full overflow-x-auto">
      {/* Header */}
      <div
        className="grid border-b py-2"
        style={{
          gridTemplateColumns: `65px repeat(${columnCount}, 1fr)`,
        }}
      >
        <div />

        {hasSummary ? (
          <>
            {visibleGroups.map((group, idx) => (
              <div
                key={idx}
                className="flex flex-col text-center"
              >
                <div className="text-[10px] md:text-sm font-bold">
                  Change {idx + 1}
                </div>

                <div className="text-[8px] md:text-xs font-normal text-gray-500">
                  {group.label}
                </div>
              </div>
            ))}

            <div className="flex flex-col text-center">
              <div className="text-[10px] md:text-sm font-bold">
                Summary
              </div>

              <div className="text-[10px] md:text-xs font-normal text-gray-500">
                {changeLog[summaryGroupIdx].label}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col text-center">
            <div className="text-[10px] md:text-sm font-bold">
              Summary
            </div>

            <div className="text-[8px] md:text-sm font-normal text-gray-500">
              {changeLog[0]?.label}
            </div>
          </div>
        )}
      </div>

      {/* Rows */}
      {classes.map((cls) => {
        const row = pivot.get(cls)!;

        return (
          <div
            key={cls}
            className="grid py-2 border-b text-[10px] md:text-xs"
            style={{
              gridTemplateColumns: `65px repeat(${columnCount}, 1fr)`,
            }}
          >
            <div className="font-medium">
              {cls}
            </div>

            {/* Historical Changes */}
            {hasSummary &&
              visibleGroups.map((_, idx) => {
                const cell = row.get(idx);

                if (!cell) {
                  return (
                    <div
                      key={idx}
                      className="text-gray-400"
                    >
                      —
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-center gap-3 text-[8px] md:text-xs"
                  >
                    <div className="shrink-0">
                      {cell.changeDirection === 'up' ? (
                        <ArrowUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>

                    <div className="flex flex-col leading-tight">
                      <div className="">
                        {cell.percentChange}
                      </div>

                      <div className="text-gray-500">
                        {cell.sqkmChange}
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* Summary Column */}
            {(() => {
              const cell = row.get(summaryGroupIdx);

              if (!cell) {
                return (
                  <div
                    key="summary"
                    className="text-gray-400"
                  >
                    —
                  </div>
                );
              }

              return (
                <div
                  key="summary"
                  className="flex items-center justify-center gap-3"
                >
                  <div className="shrink-0">
                    {cell.changeDirection === 'up' ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>

                  <div className="flex flex-col leading-tight">
                    <div className="text-[8px] md:text-xs">
                      {cell.percentChange}
                    </div>

                    <div className="text-[8px] md:text-xs text-gray-500">
                      {cell.sqkmChange}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
};


