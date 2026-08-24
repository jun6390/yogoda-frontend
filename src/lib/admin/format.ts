const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/*
 * 어드민은 다국어가 없어 "YYYY-MM-DD HH:mm" 고정 포맷만 사용함
 */
export function formatDateTime(iso: string) {
  const parts = dateTimeFormatter.formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}
