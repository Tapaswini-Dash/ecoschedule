import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

export default function CollectionChart({ data }) {
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <BarChart data={data} barGap={4}>
          <CartesianGrid vertical={false} stroke="#232d27" />
          <XAxis dataKey="day" stroke="#8a9a91" tickLine={false} axisLine={false} />
          <YAxis stroke="#8a9a91" tickLine={false} axisLine={false} width={32} />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#18201c', border: '1px solid #232d27', borderRadius: 8 }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="scheduled" name="Scheduled" fill="#2d3a33" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" name="Completed" fill="#3fb868" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}