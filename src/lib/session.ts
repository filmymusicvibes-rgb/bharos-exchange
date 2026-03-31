// Centralized auth session management
// Uses sessionStorage — auto-logout when browser closes

const AUTH_KEY = "bharos_user"

export function getUser(): string | null {
  return sessionStorage.getItem(AUTH_KEY)
}

export function setUser(email: string): void {
  sessionStorage.setItem(AUTH_KEY, email)
}

export function removeUser(): void {
  sessionStorage.removeItem(AUTH_KEY)
}

export function isLoggedIn(): boolean {
  return !!sessionStorage.getItem(AUTH_KEY)
}
