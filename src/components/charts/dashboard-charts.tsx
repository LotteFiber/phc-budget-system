"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);
  return mounted;
}

// Budget Summary Donut Chart
export function BudgetSummaryChart({
  data,
}: {
  data: { totalSpent: number; totalAllocated: number };
}) {
  const mounted = useHasMounted();
  if (!mounted) return <div style={{ height: 300 }} />;
  const chartData = [
    { name: "Spent", value: data.totalSpent, color: "#ef4444" },
    {
      name: "Remaining",
      value: data.totalAllocated - data.totalSpent,
      color: "#22c55e",
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${((percent || 0) * 100).toFixed(0)}%`
          }
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Expense Summary Bar Chart
export function ExpenseSummaryChart({
  byCategory,
}: {
  byCategory: { categoryName: string; total: number; count: number }[];
}) {
  const mounted = useHasMounted();
  if (!mounted) return <div style={{ height: 350 }} />;
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);
  };

  const chartData = byCategory
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map((cat) => ({
      name:
        cat.categoryName.length > 20
          ? cat.categoryName.substring(0, 20) + "..."
          : cat.categoryName,
      amount: cat.total,
      count: cat.count,
    }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 100, right: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={formatCurrency} />
        <YAxis type="category" dataKey="name" width={90} />
        <Tooltip
          formatter={(value: number | undefined) =>
            new Intl.NumberFormat("th-TH", {
              style: "currency",
              currency: "THB",
              minimumFractionDigits: 0,
            }).format(value ?? 0)
          }
        />
        <Bar dataKey="amount" fill="#3b82f6" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Department Analysis Horizontal Bar Chart
export function DepartmentAnalysisChart({
  analysis,
}: {
  analysis: {
    departmentName: string;
    utilizationRate: number;
    totalSpent: number;
    totalAllocated: number;
  }[];
}) {
  const mounted = useHasMounted();
  if (!mounted) return <div style={{ height: 400 }} />;
  const chartData = analysis
    .slice(0, 10)
    .map((dept) => ({
      name:
        dept.departmentName.length > 25
          ? dept.departmentName.substring(0, 25) + "..."
          : dept.departmentName,
      utilization: dept.utilizationRate,
      spent: dept.totalSpent,
      allocated: dept.totalAllocated,
    }))
    .sort((a, b) => b.utilization - a.utilization);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 120, right: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} />
        <YAxis type="category" dataKey="name" width={110} />
        <Tooltip
          formatter={(value: number | undefined, name: string | undefined) => {
            if (value === undefined) return "";
            if (name === "utilization") return `${value.toFixed(1)}%`;
            return new Intl.NumberFormat("th-TH", {
              style: "currency",
              currency: "THB",
              minimumFractionDigits: 0,
            }).format(value);
          }}
        />
        <Legend />
        <Bar
          dataKey="utilization"
          fill="#8b5cf6"
          name="Utilization %"
          radius={[0, 8, 8, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Approval Timeline Area Chart
export function ApprovalTimelineChart({
  byLevel,
}: {
  byLevel: { level: number; avgDuration: number; count: number }[];
}) {
  const mounted = useHasMounted();
  if (!mounted) return <div style={{ height: 300 }} />;
  const chartData = byLevel
    .sort((a, b) => a.level - b.level)
    .map((level) => ({
      level: `Level ${level.level}`,
      hours: level.avgDuration,
      days: level.avgDuration / 24,
      count: level.count,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="level" />
        <YAxis />
        <Tooltip
          formatter={(value: number | undefined, name: string | undefined) => {
            if (value === undefined) return "";
            if (name === "hours") return `${value.toFixed(1)} hours`;
            if (name === "days") return `${value.toFixed(1)} days`;
            return value;
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="hours"
          stroke="#f97316"
          fillOpacity={1}
          fill="url(#colorHours)"
          name="Avg Hours"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
