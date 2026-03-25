// Simple client-side router helper

export function navigate(path: string) {
  window.history.pushState({}, "", path)
  window.dispatchEvent(new PopStateEvent("popstate"))
}

export function getCurrentPath() {
  return window.location.pathname
}

export const routes = {

  home: "/",

  auth: "/auth",

  dashboard: "/dashboard",

  wallet: "/wallet",

  withdraw: "/withdraw",

  activateMembership: "/activate-membership",

  referralNetwork: "/referral-network",

  referralEarnings: "/referral-earnings",

  profile: "/profile",

  admin: "/admin",

  adminLogin: "/admin-login"

}