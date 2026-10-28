export async function reorderQueue(
  db: D1Database,
  options: { id?: number; direction?: 'up' | 'down'; postAId?: number; postBId?: number }
): Promise<{ success: boolean; message?: string; error?: string }> {
  // Query all queued posts ordered by FIFO
  const { results } = await db.prepare(
    "SELECT id, updated_at, created_at FROM posts WHERE facebook_status = 'queued' ORDER BY updated_at ASC, id ASC"
  ).all<{ id: number; updated_at: string; created_at: string }>();

  const list = results || [];
  if (list.length <= 1) {
    return { success: true, message: 'Queue has 1 or fewer posts' };
  }

  let indexA = -1;
  let indexB = -1;

  if (options.postAId && options.postBId) {
    indexA = list.findIndex((p) => p.id === options.postAId);
    indexB = list.findIndex((p) => p.id === options.postBId);
    if (indexA === -1 || indexB === -1) {
      return { success: false, error: 'One or both posts not found in queue' };
    }
  } else if (options.id && options.direction) {
    indexA = list.findIndex((p) => p.id === options.id);
    if (indexA === -1) {
      return { success: false, error: 'Post not found in queue' };
    }
    indexB = options.direction === 'up' ? indexA - 1 : indexA + 1;
    if (indexB < 0 || indexB >= list.length) {
      return { success: true, message: 'Already at queue boundary' };
    }
  } else {
    return { success: false, error: 'Missing reorder parameters' };
  }

  // Swap positions in list
  const temp = list[indexA];
  list[indexA] = list[indexB];
  list[indexB] = temp;

  const parseSqliteUtc = (dateStr?: string | null): number => {
    if (!dateStr) return 0;
    const iso = dateStr.includes('T')
      ? (dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
      : dateStr.replace(' ', 'T') + 'Z';
    const t = new Date(iso).getTime();
    return isNaN(t) ? 0 : t;
  };

  const formatSqliteUtc = (ms: number): string => {
    const d = new Date(ms);
    return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
  };

  // Find minimum timestamp among all queued posts
  const allTimes = list.map((p) => parseSqliteUtc(p.updated_at || p.created_at)).filter((t) => t > 0);
  const minTime = allTimes.length > 0 ? Math.min(...allTimes) : Date.now();

  // Re-sequence the queued posts with 2-second spacing starting from minTime
  // This guarantees strictly monotonic ordering with 0 collisions and 0 tie-breaking issues!
  const statements = list.map((post, idx) => {
    const timeStr = formatSqliteUtc(minTime + idx * 2000);
    return db.prepare('UPDATE posts SET updated_at = ? WHERE id = ?').bind(timeStr, post.id);
  });

  await db.batch(statements);

  return { success: true, message: 'Queue reordered successfully' };
}
