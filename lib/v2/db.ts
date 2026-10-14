// V2 local mode is intentionally independent of Cloudflare's production bindings.
export const writeEnabled=()=>process.env.NODE_ENV==='development';
