import { getAccessToken } from './auth/session';
import { isConfigured, rest, restCount } from './backend';
import { LEADERBOARD_SIZE } from './config';
import { normaliseUsername } from './validation';

const UNIQUE_VIOLATION = '23505';

/** Rows are keyed on the auth user id, so writes carry the user's token. */
async function writeRow(row) {
  const token = await getAccessToken();
  if (!token) throw new Error('NOT_SIGNED_IN');

  await rest('climbers?on_conflict=id', {
    method: 'POST',
    token,
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: [row],
  });
}

/** The climber's own row — authoritative for the name shown on the ranking. */
export async function fetchClimber(userId) {
  const rows = await rest(`climbers?select=username,total_ms&id=eq.${userId}&limit=1`);
  const row = rows?.[0];
  return row ? { username: row.username, totalMs: Number(row.total_ms) || 0 } : null;
}

export async function isUsernameTaken(username) {
  const name = normaliseUsername(username);
  const rows = await rest(`climbers?select=id&username=ilike.${encodeURIComponent(name)}&limit=1`);
  return (rows?.length ?? 0) > 0;
}

export async function claimUsername(userId, username, totalMs = 0) {
  try {
    await writeRow({ id: userId, username: normaliseUsername(username), total_ms: Math.round(totalMs) });
    return { ok: true };
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) return { ok: false, taken: true };
    throw error;
  }
}

export async function pushTotal(userId, username, totalMs) {
  await writeRow({ id: userId, username: normaliseUsername(username), total_ms: Math.round(totalMs) });
}

/** Removes the climber's row and their account. Irreversible. */
export async function deleteOwnAccount() {
  const token = await getAccessToken();
  if (!token) throw new Error('NOT_SIGNED_IN');
  await rest('rpc/delete_own_account', { method: 'POST', token, body: {} });
}

export async function fetchTop(limit = LEADERBOARD_SIZE) {
  const rows = await rest(
    `climbers?select=id,username,total_ms&order=total_ms.desc,updated_at.asc&limit=${limit}`,
  );
  return (rows ?? []).map((row, index) => ({
    id: row.id,
    username: row.username,
    totalMs: Number(row.total_ms) || 0,
    rank: index + 1,
  }));
}

export async function fetchRank(totalMs) {
  const ahead = await restCount(`climbers?select=id&total_ms=gt.${Math.round(totalMs)}`);
  return ahead + 1;
}

export { isConfigured };
