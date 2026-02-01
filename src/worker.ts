import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

export default {
  async fetch(request, env, ctx) {
    return getAssetFromKV(
      {
        request,
        waitUntil: ctx.waitUntil.bind(ctx)
      },
      {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST
      },
    )
  }
}
