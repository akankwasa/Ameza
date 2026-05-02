export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(new Date(date));

export const formatRating = (avg: number, count: number) =>
  `${avg.toFixed(1)} (${count} review${count !== 1 ? "s" : ""})`;

export const slugify = (text: string) =>
  text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
