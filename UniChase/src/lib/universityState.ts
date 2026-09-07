import { useEffect, useRef, useState } from "react"
import { fetchSavedUniversities, saveUniversityToAccount, removeUniversityFromAccount, fetchFollowedUniversities, followUniversityToAccount, unfollowUniversityFromAccount } from "./api"
import { authChangeEvent, universityStateChangeEvent, getToken, getSavedUniversityIds, setSavedUniversityIds, getFollowedUniversityIds, setFollowedUniversityIds, getCompareUniversityIds, toggleCompareUniversity } from "./storage"

function snapshot() { return { savedIds: getSavedUniversityIds(), followedIds: getFollowedUniversityIds(), compareIds: getCompareUniversityIds() } }
type SyncResult = { saved?: number[]; followed?: number[]; savedFailed?: boolean; followedFailed?: boolean }
let accountSync: { token: string; startedAt: number; promise: Promise<SyncResult> } | null = null

function syncAccount(token: string) {
  if (accountSync?.token === token && Date.now() - accountSync.startedAt < 15_000) return accountSync.promise
  const promise = Promise.allSettled([fetchSavedUniversities(token), fetchFollowedUniversities(token)]).then(([saved, followed]) => ({
    saved: saved.status === "fulfilled" ? saved.value.map((item) => item.id) : undefined,
    followed: followed.status === "fulfilled" ? followed.value.map((item) => item.id) : undefined,
    savedFailed: saved.status === "rejected",
    followedFailed: followed.status === "rejected",
  }))
  accountSync = { token, startedAt: Date.now(), promise }
  return promise
}

export function useUniversityState() {
  const [state, setState] = useState(snapshot)
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState<string[]>([])
  const pendingRef = useRef(new Set<string>())

  useEffect(() => {
    let active = true
    const sync = () => setState(snapshot())
    const load = () => {
      sync()
      const token = getToken()
      if (!token) { setMessage(""); return }
      syncAccount(token).then((result) => {
        if (!active || getToken() !== token) return
        if (result.saved) setSavedUniversityIds(result.saved)
        if (result.followed) setFollowedUniversityIds(result.followed)
        setMessage(result.savedFailed || result.followedFailed ? "Some university preferences could not be synced. Please try again." : "")
      })
    }
    load()
    window.addEventListener(universityStateChangeEvent, sync)
    window.addEventListener("storage", sync)
    window.addEventListener(authChangeEvent, load)
    return () => { active = false; window.removeEventListener(universityStateChangeEvent, sync); window.removeEventListener("storage", sync); window.removeEventListener(authChangeEvent, load) }
  }, [])

  const toggle = async (id: number, kind: "saved" | "followed") => {
    const key = `${kind}-${id}`
    if (pendingRef.current.has(key)) return
    pendingRef.current.add(key)
    const read = kind === "saved" ? getSavedUniversityIds : getFollowedUniversityIds
    const write = kind === "saved" ? setSavedUniversityIds : setFollowedUniversityIds
    const selected = read().includes(id)
    const token = getToken()
    setMessage(""); setPending([...pendingRef.current])
    try {
      if (token) {
        const action = kind === "saved" ? (selected ? removeUniversityFromAccount : saveUniversityToAccount) : (selected ? unfollowUniversityFromAccount : followUniversityToAccount)
        await action(token, id)
        if (getToken() !== token) return
        accountSync = null
      }
      write(selected ? read().filter((item) => item !== id) : [...read(), id])
    } catch { setMessage(`Could not ${selected ? "remove" : kind === "saved" ? "save" : "follow"} this university. Please try again.`) }
    finally { pendingRef.current.delete(key); setPending([...pendingRef.current]) }
  }

  return { ...state, message, pending, toggleSaved: (id: number) => toggle(id, "saved"), toggleFollowed: (id: number) => toggle(id, "followed"), toggleCompare: toggleCompareUniversity }
}
