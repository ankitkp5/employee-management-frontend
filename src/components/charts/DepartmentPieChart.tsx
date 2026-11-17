import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { chartColors } from "../../constants";
import type { DepartmentDistribution } from "../../types";

export default function DepartmentPieChart({
  data,
}: {
  data: DepartmentDistribution[];
}) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="employeeCount"
            nameKey="departmentName"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label
          >
            {data.map((item, index) => (
              <Cell
                key={item.departmentId}
                fill={chartColors[index % chartColors.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
