import { useState, useEffect } from 'react'
import { lumi } from '@/lib/lumi'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await lumi.auth.getUser()
        setUser(currentUser)
        setIsAuthenticated(!!currentUser)
      } catch (error) {
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const unsubscribe = lumi.auth.onAuthChange((user) => {
      setUser(user)
      setIsAuthenticated(!!user)
    })

    return () => unsubscribe()
  }, [])

  return { isAuthenticated, user, loading }
}
