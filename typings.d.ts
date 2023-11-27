declare module 'bun' {
  interface Env {
    PRIVATE_KEY: string;
    X_ACCESS_TOKEN: string;
    NODE_TLS_REJECT_UNAUTHORIZED: string;
  }
}
