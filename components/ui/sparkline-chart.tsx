"use client";

import React from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface SparklineChartProps {
  data: Array<{ value: number }>;
  themeText: string;
  gradientId: string;
}

export default function SparklineChart({ data, themeText, gradientId }: SparklineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="currentColor" stopOpacity={0.3} />
            <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="currentColor"
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          className={themeText}
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
