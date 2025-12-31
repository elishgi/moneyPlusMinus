const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Request failed')
  }

  return response.json()
}

export async function loginUser(name) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function fetchUserProfile(userId) {
  return request(`/users/${userId}`)
}

export async function saveAwareness(userId, awarenessData, completed = false) {
  return request(`/users/${userId}/awareness`, {
    method: 'PUT',
    body: JSON.stringify({ awarenessData, completed }),
  })
}

export async function saveBudget(userId, monthLabel, budget) {
  return request(`/users/${userId}/budgets`, {
    method: 'PUT',
    body: JSON.stringify({ monthLabel, ...budget }),
  })
}
