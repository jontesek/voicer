export function revokeAfterDelay(url, ms = 500) {
  setTimeout(() => {
    URL.revokeObjectURL(url);
    console.log('Object URL revoked after delay.');
  }, ms);
}
