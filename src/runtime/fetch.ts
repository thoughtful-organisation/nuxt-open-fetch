import type { RuntimeNuxtHooks } from '#app'
import type { OpenFetchClientName } from '#build/open-fetch'
import type {
  ClientFetchHooks,
  GlobalFetchHooks,
} from '#build/types/open-fetch-hooks'
import type { Hookable } from 'hookable'
import type {
  FetchContext,
  FetchError,
  FetchHooks,
  FetchOptions,
} from 'ofetch'
import type {
  ErrorResponse,
  MediaType,
  OperationRequestBodyContent,
  ResponseObjectMap,
  SuccessResponse,
} from 'openapi-typescript-helpers'

type Hooks = Hookable<GlobalFetchHooks & ClientFetchHooks> | null

export type FetchResponseData<T extends Record<string | number, any>>
  = SuccessResponse<ResponseObjectMap<T>, MediaType>
export type FetchResponseError<T extends Record<string | number, any>>
  = FetchError<ErrorResponse<ResponseObjectMap<T>, MediaType>>

export type MethodOption<M, P> = 'get' extends keyof P
  ? { method?: M }
  : { method: M }

export type ParamsOption<T> = T extends { parameters?: any, query?: any }
  ? T['parameters']
  : Record<string, never>

// Type for form data bodies (multipart/form-data)
type FormDataBody<T> = T extends {
  requestBody?: { content: { 'multipart/form-data': infer Body } }
}
  ? Body | FormData
  : never

// Type for URL encoded bodies (application/x-www-form-urlencoded)
type UrlEncodedBody<T> = T extends {
  requestBody?: {
    content: { 'application/x-www-form-urlencoded': infer Body }
  }
}
  ? Body | URLSearchParams
  : never

// Type for JSON bodies (application/json)
type JsonBody<T> = T extends {
  requestBody?: { content: { 'application/json': infer Body } }
}
  ? Body
  : never

// Helper to create union of available body types
type AvailableBodyTypes<T>
  = | (FormDataBody<T> extends never ? never : FormDataBody<T>)
    | (UrlEncodedBody<T> extends never ? never : UrlEncodedBody<T>)
    | (JsonBody<T> extends never ? never : JsonBody<T>)

// Enhanced body type that handles all content types
type EnhancedRequestBody<T>
  = AvailableBodyTypes<T> extends never
    ? OperationRequestBodyContent<T>
    : AvailableBodyTypes<T>

export type RequestBodyOption<T>
  = EnhancedRequestBody<T> extends never
    ? { body?: never }
    : undefined extends EnhancedRequestBody<T>
      ? { body?: EnhancedRequestBody<T> }
      : { body: EnhancedRequestBody<T> }

export type FilterMethods<T> = {
  [K in keyof Omit<T, 'parameters'> as T[K] extends never | undefined
    ? never
    : K]: T[K];
}

type OpenFetchOptions<
  Method,
  LowercasedMethod,
  Params,
  Operation = 'get' extends LowercasedMethod
    ? 'get' extends keyof Params
      ? Params['get']
      : never
    : LowercasedMethod extends keyof Params
      ? Params[LowercasedMethod]
      : never,
> = MethodOption<Method, Params>
  & ParamsOption<Operation>
  & RequestBodyOption<Operation>
  & Omit<FetchOptions, 'query' | 'body' | 'method'>

export type OpenFetchClient<Paths> = <
  ReqT extends Extract<keyof Paths, string>,
  Methods extends FilterMethods<Paths[ReqT]>,
  Method extends
  | Extract<keyof Methods, string>
  | Uppercase<Extract<keyof Methods, string>>,
  LowercasedMethod extends Lowercase<Method> extends keyof Methods
    ? Lowercase<Method>
    : never,
  DefaultMethod extends 'get' extends LowercasedMethod
    ? 'get'
    : LowercasedMethod,
  ResT = Methods[DefaultMethod] extends Record<string | number, any>
    ? FetchResponseData<Methods[DefaultMethod]>
    : never,
>(
  url: ReqT,
  options?: OpenFetchOptions<Method, LowercasedMethod, Methods>,
) => Promise<ResT>

// More flexible way to rewrite the request path,
// but has problems - https://github.com/unjs/ofetch/issues/319
export function openFetchRequestInterceptor(ctx: FetchContext) {
  // @ts-expect-error - `path` is not in FetchOptions
  ctx.request = fillPath(ctx.request as string, ctx.options.path)
}

function createHook<T extends keyof FetchHooks>(
  hooks: NonNullable<Hooks>,
  baseOpts: FetchOptions,
  hook: T,
  hookIdentifier?: OpenFetchClientName,
) {
  // @ts-ignore
  return async (...args: Parameters<RuntimeNuxtHooks[`openFetch:${T}`]>) => {
    await hooks.callHook(`openFetch:${hook}`, ...args)

    if (hookIdentifier) {
      await hooks.callHook(
        `openFetch:${hook}:${hookIdentifier}`,
        ...(args as any),
      )
    }

    const ctx = args[0]
    const baseHook = baseOpts[hook]

    if (baseHook) {
      await (Array.isArray(baseHook)
        ? Promise.all(baseHook.map(h => h(ctx as any)))
        : baseHook(ctx as any))
    }
  }
}

function getOpenFetchHooks(
  hooks: Hooks,
  baseOpts: FetchOptions,
  hookIdentifier?: OpenFetchClientName,
) {
  const openFetchHooks: Array<keyof FetchHooks> = [
    'onRequest',
    'onRequestError',
    'onResponse',
    'onResponseError',
  ]

  if (!hooks)
    return {} as FetchHooks

  return openFetchHooks.reduce<FetchHooks>((acc, hook) => {
    // @ts-ignore
    acc[hook as keyof FetchHooks] = createHook(
      hooks,
      baseOpts,
      hook as keyof FetchHooks,
      hookIdentifier,
    )
    return acc
  }, {} as FetchHooks)
}

export function createOpenFetch<Paths>(
  options: FetchOptions | ((options: FetchOptions) => FetchOptions),
  localFetch?: typeof globalThis.$fetch,
  hookIdentifier?: string,
  hooks: Hookable<any> | null = null,
): OpenFetchClient<Paths> {
  return (url: string, baseOpts: any) => {
    baseOpts
      = typeof options === 'function'
        ? options(baseOpts)
        : {
            ...options,
            ...baseOpts,
          }

    const opts: FetchOptions & { path?: Record<string, string> } = {
      ...baseOpts,
      ...getOpenFetchHooks(
        hooks,
        baseOpts,
        hookIdentifier as OpenFetchClientName,
      ),
    }

    const $fetch = getFetch(url, opts, localFetch)

    return $fetch(fillPath(url, opts?.path), opts as any)
  }
}

function getFetch(
  url: string,
  opts: FetchOptions,
  localFetch?: typeof globalThis.$fetch,
) {
  if (import.meta.server && localFetch) {
    const isLocalFetch
      = url[0] === '/' && (!opts.baseURL || opts.baseURL![0] === '/')
    if (isLocalFetch)
      return localFetch
  }

  return globalThis.$fetch
}

export function fillPath(path: string, params: Record<string, string> = {}) {
  for (const [k, v] of Object.entries(params))
    path = path.replace(`{${k}}`, encodeURIComponent(String(v)))
  return path
}
