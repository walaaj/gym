import { useState } from 'react'
import { FULL_DAY } from '../data/plan.js'

function formatDate(date) {
  const [y, m, d] = String(date).split('-').map(Number)
  if (!y || !m || !d) return String(date)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function WorkoutRow({ workout, onSaveNotes, onDelete, onOpenEdit }) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(workout.notes || '')
  const [busy, setBusy] = useState(false)
  const [armed, setArmed] = useState(false)

  const done = workout.status === 'completed'
  const pct = workout.totalSteps ? Math.round((workout.stepIndex / workout.totalSteps) * 100) : 0

  async function startEdit() {
    const fresh = await onOpenEdit(workout.workoutId)
    setNotes((fresh || workout).notes || '')
    setEditing(true)
  }

  async function save() {
    setBusy(true)
    try {
      await onSaveNotes(workout.workoutId, notes.trim())
      setEditing(false)
    } catch {
      // The error banner explains what went wrong; keep the editor open.
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    // Two taps, like Reset: the first arms it, the second deletes.
    if (!armed) return setArmed(true)
    setBusy(true)
    try {
      await onDelete(workout.workoutId)
    } catch {
      setArmed(false)
      setBusy(false)
    }
  }

  return (
    <li className="hist-item">
      <div className="hist-head">
        <div className="hist-title">
          <b>{workout.title || FULL_DAY[workout.day] || 'Workout'}</b>
          <small>
            {formatDate(workout.date)} · {FULL_DAY[workout.day] || workout.day}
          </small>
        </div>
        <span className={`hist-status${done ? ' ok' : ''}`}>
          {done ? 'Completed' : `${workout.stepIndex}/${workout.totalSteps} · ${pct}%`}
        </span>
      </div>

      {editing ? (
        <div className="hist-edit">
          <label className="sr-only" htmlFor={`notes-${workout.workoutId}`}>
            Notes
          </label>
          <textarea
            id={`notes-${workout.workoutId}`}
            rows={3}
            maxLength={1000}
            value={notes}
            placeholder="How did it go? Weights, how you felt…"
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="hist-actions">
            <button className="chip" disabled={busy} onClick={save}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button className="chip" disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {workout.notes && <p className="hist-notes">{workout.notes}</p>}
          <div className="hist-actions">
            <button className="chip" disabled={busy} onClick={startEdit}>
              {workout.notes ? 'Edit notes' : 'Add notes'}
            </button>
            <button
              className={`chip${armed ? ' danger' : ''}`}
              disabled={busy}
              onClick={remove}
              onBlur={() => setArmed(false)}
            >
              {armed ? 'Tap again to delete' : 'Delete'}
            </button>
          </div>
        </>
      )}
    </li>
  )
}

export default function History({ workouts, onSaveNotes, onDelete, onOpenEdit }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="history">
      <button className="hist-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>Workout history</span>
        <small>{workouts.length ? `${workouts.length} saved` : 'None yet'}</small>
      </button>
      {open &&
        (workouts.length ? (
          <ul className="hist-list">
            {workouts.map((w) => (
              <WorkoutRow
                key={w.workoutId}
                workout={w}
                onSaveNotes={onSaveNotes}
                onDelete={onDelete}
                onOpenEdit={onOpenEdit}
              />
            ))}
          </ul>
        ) : (
          <p className="hist-empty">Workouts you start are saved here.</p>
        ))}
    </section>
  )
}
