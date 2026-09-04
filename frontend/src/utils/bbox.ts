export const parseBBox = (
  bbox: unknown,
  naturalWidth: number,
  naturalHeight: number
): { leftPercent: number; topPercent: number; widthPercent: number; heightPercent: number } | null => {
  if (!bbox || naturalWidth <= 0 || naturalHeight <= 0) return null;

  let xmin = 0;
  let ymin = 0;
  let xmax = 0;
  let ymax = 0;

  // Case 1: [x1, y1, x2, y2]
  if (Array.isArray(bbox) && bbox.length === 4 && bbox.every((n) => typeof n === 'number')) {
    const [x1, y1, x2, y2] = bbox;
    xmin = Math.min(x1, x2);
    xmax = Math.max(x1, x2);
    ymin = Math.min(y1, y2);
    ymax = Math.max(y1, y2);
  }
  // Case 2: Polygon points [[x1, y1], [x2, y2], ...]
  else if (
    Array.isArray(bbox) &&
    bbox.length >= 2 &&
    bbox.every((pt) => Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number')
  ) {
    const xs = bbox.map((pt) => pt[0]);
    const ys = bbox.map((pt) => pt[1]);
    xmin = Math.min(...xs);
    xmax = Math.max(...xs);
    ymin = Math.min(...ys);
    ymax = Math.max(...ys);
  } else {
    // Malformed coordinates - return null gracefully without crashing
    return null;
  }

  if (xmax <= xmin || ymax <= ymin) {
    return null;
  }

  const leftPercent = Math.max(0, Math.min(100, (xmin / naturalWidth) * 100));
  const topPercent = Math.max(0, Math.min(100, (ymin / naturalHeight) * 100));
  const widthPercent = Math.max(0.2, Math.min(100 - leftPercent, ((xmax - xmin) / naturalWidth) * 100));
  const heightPercent = Math.max(0.2, Math.min(100 - topPercent, ((ymax - ymin) / naturalHeight) * 100));

  return { leftPercent, topPercent, widthPercent, heightPercent };
};
