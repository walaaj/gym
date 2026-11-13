import { demoUrl } from '../lib/session.js'

export default function DemoLink({ entry, mini = false }) {
  return (
    <a
      className={`demo${mini ? ' mini' : ''}`}
      href={demoUrl(entry)}
      target="_blank"
      rel="noopener noreferrer"
    >
      Watch demo ↗
    </a>
  )
}
