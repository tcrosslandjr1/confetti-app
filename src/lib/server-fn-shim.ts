export function createServerFn() {
  const chain = {
    middleware: () => chain,
    inputValidator: () => chain,
    handler: () => async () => {
      throw new Error('Server functions are not available in SPA mode');
    }
  };
  return chain;
}
