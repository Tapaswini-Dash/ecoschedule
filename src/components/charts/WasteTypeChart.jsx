import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

export default function WasteTypeChart({ data }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-44 w-44 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={50} outerRadius={78} paddingAngle={2} stroke="none">
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: '#18201c', border: '1px solid #232d27', borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="font-semibold">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}