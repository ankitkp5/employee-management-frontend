// Today's date (local time) as YYYY-MM-DD.
export const today = () => {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().slice(0, 10);
};

export const currency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const dateText = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN");
};

export const badge = (status?: string) =>
  `status-badge status-${(status || "unknown")
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

export const inputTime = (value?: string | null) =>
  value ? value.slice(0, 5) : "";
