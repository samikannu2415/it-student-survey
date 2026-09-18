// src/api/polls.js
// Thin API client wrapping the Go backend REST endpoints.

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

/** Fetch all active polls */
export const listPolls = ()        => request('/polls');

/** Fetch a single poll by id */
export const getPoll   = (id)      => request(`/polls/${id}`);

/** Create a new poll */
export const createPoll = (body)   => request('/polls', { method: 'POST', body: JSON.stringify(body) });

/** Cast a vote */
export const castVote   = (body)   => request('/polls/vote', { method: 'POST', body: JSON.stringify(body) });
