import { useCallback, useEffect, useState } from 'react'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function useWorkoutImages(api) {
  const [keys, setKeys] = useState({})
  const [urls, setUrls] = useState({})
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let live = true
    api.getSettings().then((settings) => {
      if (live) { setKeys(settings.workoutImages || {}); setReady(true) }
    }).catch(() => { if (live) setReady(true) })
    return () => { live = false }
  }, [api])

  const resolve = useCallback(async (name, key) => {
    if (!key) { setUrls((old) => ({ ...old, [name]: '' })); return }
    try {
      const url = await api.getUploadViewUrl(key)
      setUrls((old) => ({ ...old, [name]: url }))
    } catch (err) {
      setErrors((old) => ({ ...old, [name]: err.message || 'Unable to load image.' }))
    }
  }, [api])

  useEffect(() => {
    if (!ready) return
    Object.entries(keys).forEach(([name, key]) => { if (key && !urls[name]) resolve(name, key) })
  }, [keys, ready, resolve, urls])

  const upload = useCallback(async (exerciseName, file) => {
    const id = slug(exerciseName)
    setErrors((old) => ({ ...old, [id]: '' }))
    if (!ALLOWED.has(file.type)) { setErrors((old) => ({ ...old, [id]: 'Choose a JPEG, PNG or WebP image.' })); return }
    if (file.size > MAX_SIZE) { setErrors((old) => ({ ...old, [id]: 'Image must be 10 MB or smaller.' })); return }
    setBusy((old) => ({ ...old, [id]: true }))
    try {
      const { uploadUrl, key, requiredHeaders = {} } = await api.createUploadUrl({ contentType: file.type, fileSize: file.size })
      const response = await fetch(uploadUrl, { method: 'PUT', headers: requiredHeaders, body: file })
      if (!response.ok) throw new Error(`S3 upload failed (${response.status}).`)
      const next = { ...keys, [id]: key }
      await api.saveSettings({ workoutImages: next })
      setKeys(next)
      setUrls((old) => ({ ...old, [id]: '' }))
      await resolve(id, key)
    } catch (err) {
      setErrors((old) => ({ ...old, [id]: err.message || 'Upload failed.' }))
    } finally { setBusy((old) => ({ ...old, [id]: false })) }
  }, [api, keys, resolve])

  const remove = useCallback(async (exerciseName) => {
    const id = slug(exerciseName)
    setBusy((old) => ({ ...old, [id]: true }))
    try {
      const next = { ...keys }; delete next[id]
      await api.saveSettings({ workoutImages: next })
      setKeys(next); setUrls((old) => ({ ...old, [id]: '' })); setErrors((old) => ({ ...old, [id]: '' }))
    } catch (err) { setErrors((old) => ({ ...old, [id]: err.message || 'Could not remove image.' })) }
    finally { setBusy((old) => ({ ...old, [id]: false })) }
  }, [api, keys])

  return { keys, urls, ready, busy, errors, upload, remove, idFor: slug }
}
