export async function waitMillis(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitSeconds(seconds: number) {
  return waitMillis(seconds * 1000);
}

export async function waitMinutes(minutes: number) {
  return waitMillis(minutes * 1000 * 60);
}

export const AsyncUtils = {
  waitMillis,
  waitSeconds,
  waitMinutes,
};
