interface ImportMetaEnv {
  readonly [key: string]: string | undefined;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.html?raw" {
  const src: string;
  export default src;
}
declare module "*.css?url" {
  const src: string;
  export default src;
}
declare module "virtual:grok-og-identity" {
  export const grokOgIdentity: { title?: string; description?: string; image?: string; site?: { title?: string; description?: string; image?: string } };
}
