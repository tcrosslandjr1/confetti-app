// Wrapped serve(): runs every request inside AsyncLocalStorage so corsHeaders()
// inside the handler can echo the right Origin without threading req around.

import { serve as denoServe } from "https://deno.land/std@0.177.0/http/server.ts";
import { withRequestContext } from "./cors.ts";

type Handler = (req: Request) => Response | Promise<Response>;

export function serve(handler: Handler) {
  return denoServe((req: Request) =>
    withRequestContext(req, () => handler(req)) as Response | Promise<Response>,
  );
}
