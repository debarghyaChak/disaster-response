const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Create a new disaster
 */
export async function createDisaster(data) {
  const res = await fetch(`${BASE_URL}/disasters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

/**
 * Update a disaster by ID
 */
export async function updateDisaster(id, data) {
  const res = await fetch(`${BASE_URL}/disasters/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

/**
 * Delete a disaster (admin only)
 */
export async function deleteDisaster(id, token) {
  const res = await fetch(`${BASE_URL}/disasters/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Only if auth is implemented
    },
  });
  return await res.json();
}

/**
 * Get all disasters (optional filter by tag)
 */
export async function getDisasters(tag = "") {
  const url = tag ? `${BASE_URL}/disasters?tag=${tag}` : `${BASE_URL}/disasters`;
  console.log('Fetching disasters from:', url);
  const res = await fetch(url);
  return await res.json();
}

/**
 * Submit a report (e.g., from a citizen)
 */
export async function submitReport(data) {
  const res = await fetch(`${BASE_URL}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

/**
 * Get social media reports for a disaster
 */
export async function getSocialMedia(disasterId) {
  const res = await fetch(`${BASE_URL}/disasters/${disasterId}/social-media`);
  return await res.json();
}

/**
 * Get official updates (NDMA RSS feed)
 */
export async function getOfficialUpdates(disasterId) {
  const res = await fetch(`${BASE_URL}/disasters/${disasterId}/official-updates`);
  return await res.json();
}

/**
 * Verify image for a report/disaster
 */
export async function verifyImage(disasterId) {
  const res = await fetch(`${BASE_URL}/disasters/${disasterId}/verify-image`, {
    method: "POST",
  });
  return await res.json();
}
