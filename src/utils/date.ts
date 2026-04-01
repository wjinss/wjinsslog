export function formatTimeAgo(
  input: string | number | Date,
  nowDate: Date = new Date(),
): string {
  const targetDate = new Date(input);
  const diffMs = nowDate.getTime() - targetDate.getTime();

  if (Number.isNaN(targetDate.getTime()) || diffMs < 0) {
    return "";
  }

  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;

  if (diffMs < minute) {
    return "방금 전";
  }

  if (diffMs < hour) {
    return `${Math.floor(diffMs / minute)}분 전`;
  }

  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)}시간 전`;
  }

  const dayAgo = Math.floor(diffMs / day);
  if (dayAgo <= 3) {
    return `${dayAgo}일 전`;
  }

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const date = String(targetDate.getDate()).padStart(2, "0");

  return `${year}.${month}.${date}`;
}
