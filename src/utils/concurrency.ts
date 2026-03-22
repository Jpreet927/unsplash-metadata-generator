export async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>,
) {
  const results = new Array<TOutput>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      const currentItem = items[currentIndex];
      nextIndex += 1;

      if (currentItem === undefined) {
        continue;
      }

      results[currentIndex] = await mapper(currentItem, currentIndex);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length || 1) },
    () => worker(),
  );

  await Promise.all(workers);
  return results;
}
