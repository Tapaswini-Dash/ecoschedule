const tips = [
  ['Wet / organic', 'Keep food scraps and garden waste separate. Drain excess liquid and use a covered container.'],
  ['Dry recyclables', 'Keep paper, cardboard, clean plastics, glass, and metal dry. Flatten packaging where practical.'],
  ['Domestic hazardous waste', 'Keep batteries, bulbs, medicines, and chemical containers separate from regular household waste.'],
  ['Sanitary waste', 'Wrap sanitary waste securely and follow your municipality’s collection instructions.'],
]

export default function SegregationGuide() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">Waste segregation guide</h2>
        <p className="mt-1 text-sm text-muted">General handling guidance. Follow local collection rules if they differ.</p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {tips.map(([title, detail]) => (
          <article key={title} className="rounded-xl border border-line bg-panel p-4">
            <h3 className="font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
          </article>
        ))}
      </div>
    </div>
  )
}