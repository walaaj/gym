const dateLabel = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export default function Header() {
  return (
    <header>
      <h1>Evening Gym</h1>
      <span className="date">{dateLabel}</span>
    </header>
  )
}
