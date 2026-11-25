import { useRef } from 'react'

export default function WorkoutImage({ exercise, images, compact = false }) {
  const inputRef = useRef(null)
  const id = images.idFor(exercise.name)
  const imageUrl = images.urls[id]
  const busy = images.busy[id]
  const error = images.errors[id]

  return (
    <div className={`workout-image${compact ? ' compact' : ''}`}>
      {imageUrl ? <img className="workout-image-preview" src={imageUrl} alt={`${exercise.name} demonstration`} /> : (
        <div className="workout-image-placeholder" aria-label="No workout image">
          <span aria-hidden="true">▧</span><small>No image</small>
        </div>
      )}
      <div className="workout-image-actions">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => {
          const file = e.target.files?.[0]; if (file) images.upload(exercise.name, file); e.target.value = ''
        }} />
        <button className="link image-action" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? 'Uploading…' : imageUrl ? 'Replace image' : 'Upload image'}</button>
        {imageUrl && <button className="link image-action" disabled={busy} onClick={() => images.remove(exercise.name)}>Remove</button>}
        {error && <span className="image-error" role="alert">{error}</span>}
      </div>
    </div>
  )
}
