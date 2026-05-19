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

export function useServerFn<T extends (...args: any[]) => any>(serverFn: T): T {
  return serverFn;
}

export function createMiddleware() {
  const chain = {
    client: () => chain,
    server: () => chain,
  };
  return chain;
}

export function createStart<T>(factory: () => T): T {
  return factory();
}

export function getRequest(): Request {
  throw new Error('Server request APIs are not available in SPA mode');
}

export function getRequestHost(): string {
  if (typeof window !== 'undefined') return window.location.host;
  throw new Error('Server request APIs are not available in SPA mode');
}
