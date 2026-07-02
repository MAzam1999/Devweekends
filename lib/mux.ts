import Mux from "@mux/mux-node";

let _mux: Mux | null = null;

export function getMux(): Mux {
  if (!_mux) {
    _mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });
  }
  return _mux;
}

export const mux = new Proxy({} as Mux, {
  get(_target, prop) {
    return getMux()[prop as keyof Mux];
  },
});

export function getMuxSigningKey() {
  return {
    keyId: process.env.MUX_SIGNING_KEY!,
    keySecret: process.env.MUX_PRIVATE_KEY!,
  };
}
