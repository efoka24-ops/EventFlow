export const parseSort = (sortValue, allowedFields, defaultSort = "-created_date") => {
  const raw = String(sortValue || defaultSort);
  const isDesc = raw.startsWith("-");
  const field = isDesc ? raw.slice(1) : raw;
  if (!allowedFields.includes(field)) {
    return { field: defaultSort.replace("-", ""), direction: defaultSort.startsWith("-") ? "DESC" : "ASC" };
  }
  return { field, direction: isDesc ? "DESC" : "ASC" };
};

export const parseLimit = (value, fallback = null, max = 200) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

export const buildWhereClause = (filters, allowedFields, startIndex = 1) => {
  const where = [];
  const values = [];
  let i = startIndex;

  for (const [key, value] of Object.entries(filters || {})) {
    if (value === undefined || value === null || value === "") continue;
    if (!allowedFields.includes(key)) continue;
    where.push(`${key} = $${i}`);
    values.push(value);
    i += 1;
  }

  return {
    clause: where.length ? `WHERE ${where.join(" AND ")}` : "",
    values,
    nextIndex: i,
  };
};
