async function waitMillis(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitSeconds(seconds: number) {
  return waitMillis(seconds * 1000);
}

async function waitMinutes(minutes: number) {
  return waitMillis(minutes * 1000 * 60);
}

export const WaitUtils = {
  waitMillis,
  waitSeconds,
  waitMinutes,
};
