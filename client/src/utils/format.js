const timeFormatter = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });
const dayFormatter = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" });
const dayWithYearFormatter = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });

const AVATAR_COLORS = [
  { background: "#fbe8de", color: "#8a2e08" },
  { background: "#e6f4ec", color: "#14532d" },
  { background: "#e0ecfb", color: "#1e3a8a" },
  { background: "#f1e6fa", color: "#581c87" },
  { background: "#fdf0c8", color: "#713f12" },
  { background: "#fce4ec", color: "#831843" },
  { background: "#dff3f1", color: "#115e59" },
  { background: "#ece7de", color: "#2b2b26" }
];

export const formatMessageTime = (isoDate) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  return timeFormatter.format(date);
};

export const dayKey = (isoDate) => {
  const date = new Date(isoDate);

  return Number.isNaN(date.getTime()) ? "" : date.toDateString();
};

export const dayLabel = (isoDate, now = new Date()) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return "Hoy";
  if (date.toDateString() === yesterday.toDateString()) return "Ayer";

  return (date.getFullYear() === now.getFullYear() ? dayFormatter : dayWithYearFormatter).format(date);
};

export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";

export const avatarColor = (name = "") => {
  let hash = 0;

  for (const char of name.trim().toLowerCase()) hash = (hash * 31 + char.codePointAt(0)) >>> 0;

  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const sameId = (id, param) => String(id) === String(param);
