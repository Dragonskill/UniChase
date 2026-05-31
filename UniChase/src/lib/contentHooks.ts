import { useEffect, useState } from 'react'
import {
  contentChangeEvent,
  getManagedForumPosts,
  getManagedMembers,
  getManagedNews,
  getManagedQaPosts,
} from '@/lib/contentStore'

function useContentItems<T>(readItems: () => T[]) {
  const [items, setItems] = useState<T[]>(() => readItems())

  useEffect(() => {
    function sync() {
      setItems(readItems())
    }

    window.addEventListener(contentChangeEvent, sync)
    window.addEventListener('storage', sync)

    return () => {
      window.removeEventListener(contentChangeEvent, sync)
      window.removeEventListener('storage', sync)
    }
  }, [readItems])

  return items
}

export function useManagedNews() {
  return useContentItems(getManagedNews)
}

export function useManagedForumPosts() {
  return useContentItems(getManagedForumPosts)
}

export function useManagedQaPosts() {
  return useContentItems(getManagedQaPosts)
}

export function useManagedMembers() {
  return useContentItems(getManagedMembers)
}
