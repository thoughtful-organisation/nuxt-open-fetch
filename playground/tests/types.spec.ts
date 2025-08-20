import type { paths } from '#open-fetch-schemas/api'
import type { Ref } from 'vue'
import { describe, expectTypeOf, it } from 'vitest'
import { createOpenFetch } from '../../src/runtime/fetch'
import { createUseOpenFetch } from '../../src/runtime/useFetch'

interface ReturnData {
  id?: number
  name: string
  category?: {
    id?: number
    name?: string
  } | undefined
  photoUrls: string[]
  tags?: {
    id?: number
    name?: string
  }[]
  status?: 'available' | 'pending' | 'sold'
}

describe('$[client]', async () => {
  const $pets = createOpenFetch<paths>({})

  it('is function', () => {
    expectTypeOf($pets).toBeFunction()
  })

  it('supports "method" in lowercase and uppercase', () => () => {
    $pets('/pet/{petId}', {
      path: { petId: 1 },
      method: 'get',
    })

    $pets('/pet/{petId}', {
      path: { petId: 1 },
      method: 'GET',
    })
  })

  it('has correct body type', () => () => {
    $pets('/pet', {
      method: 'post',
      body: {
        name: 'doggie',
        photoUrls: [],
      },
    })
  })

  it('has correct return type', () => async () => {
    const data = await $pets('/pet/{petId}')
    expectTypeOf(data).toMatchTypeOf<ReturnData>()
  })
})

describe('use[Client]', async () => {
  const usePets = createUseOpenFetch<paths>('api')

  it('is function', () => {
    expectTypeOf(usePets).toBeFunction()
  })

  it('supports "method" in lowercase and uppercase', () => () => {
    usePets('/pet/{petId}', {
      path: { petId: 1 },
      method: 'get',
    })
    usePets('/pet/{petId}', {
      path: { petId: 1 },
      method: 'GET',
    })
  })

  it('has correct "body" type', () => () => {
    usePets('/pet', {
      method: 'post',
      body: {
        name: 'doggie',
        photoUrls: [],
      },
      immediate: true,
    })
  })

  it('has correct return type', () => () => {
    const { data } = usePets('/pet/{petId}', {
      path: { petId: 1 },
      immediate: false,
    })

    expectTypeOf(data).toMatchTypeOf<Ref<ReturnData | undefined>>()
  })

  it('has correct "transform" input parameter type', () => () => {
    usePets('/pet/{petId}', {
      path: { petId: 1 },
      transform: input => ({
        foo: input.name,
      }),
      immediate: false,
    })
  })

  it('has correct response type using "transform"', () => () => {
    const { data } = usePets('/pet/{petId}', {
      method: 'get',
      path: { petId: 1 },
      transform: input => ({
        foo: input.name,
      }),
      immediate: false,
    })

    expectTypeOf(data).toMatchTypeOf<Ref<{
      foo: string
    } | undefined>>()
  })

  it('has correct reponse type using "default"', () => () => {
    const { data } = usePets('/pet/{petId}', {
      path: { petId: 1 },
      default: () => ({
        bar: 12,
      }),
      immediate: false,
    })

    expectTypeOf(data).toMatchTypeOf<Ref<ReturnData | {
      bar: number
    }>>()
  })

  it('has correct response type using "default" and "transform"', () => () => {
    const { data } = usePets('/pet/{petId}', {
      path: { petId: 1 },
      transform: input => ({
        foo: input.name,
      }),
      default: () => ({
        bar: 12,
      }),
      immediate: false,
    })

    expectTypeOf(data).toMatchTypeOf<Ref<{
      foo: string
    } | {
      bar: number
    }>>()
  })

  it('has correct response type using "pick"', () => () => {
    const { data } = usePets('/pet/{petId}', {
      path: { petId: 1 },
      pick: ['name'],
      immediate: false,
    })

    expectTypeOf(data).toMatchTypeOf<Ref<{
      name: string
    } | undefined>>()
  })
})

describe('form Data Support', async () => {
  const $pets = createOpenFetch<paths>({})
  const usePets = createUseOpenFetch<paths>('api')

  it('supports multipart/form-data with object body', () => () => {
    $pets('/pet/{petId}/uploadMultiple', {
      method: 'post',
      path: { petId: 1 },
      body: {
        files: ['file1', 'file2'] as any,
        name: 'test upload',
        description: 'test description',
        metadata: {
          tags: ['tag1', 'tag2'],
          priority: 1,
        },
      },
    })
  })

  it('supports multipart/form-data with FormData body', () => () => {
    const formData = new FormData()
    formData.append('name', 'test upload')
    formData.append('files', new File(['content'], 'test.txt'))

    $pets('/pet/{petId}/uploadMultiple', {
      method: 'post',
      path: { petId: 1 },
      body: formData,
    })
  })

  it('supports application/x-www-form-urlencoded with object body', () => () => {
    $pets('/pet/{petId}/updateForm', {
      method: 'post',
      path: { petId: 1 },
      body: {
        name: 'Updated Pet Name',
        status: 'available',
        photoUrls: ['url1', 'url2'],
      },
    })
  })

  it('supports application/x-www-form-urlencoded with URLSearchParams body', () => () => {
    const params = new URLSearchParams()
    params.append('name', 'Updated Pet Name')
    params.append('status', 'available')

    $pets('/pet/{petId}/updateForm', {
      method: 'post',
      path: { petId: 1 },
      body: params,
    })
  })

  it('supports form data in composables', () => () => {
    usePets('/pet/{petId}/uploadMultiple', {
      method: 'post',
      path: { petId: 1 },
      body: {
        files: ['file1'] as any,
        name: 'test upload',
      },
      immediate: true,
    })

    usePets('/pet/{petId}/updateForm', {
      method: 'post',
      path: { petId: 1 },
      body: {
        name: 'Updated Pet Name',
      },
      immediate: true,
    })
  })

  it('has correct return types for form endpoints', () => async () => {
    const uploadResult = await $pets('/pet/{petId}/uploadMultiple', {
      method: 'post',
      path: { petId: 1 },
      body: {
        files: ['file1'] as any,
        name: 'test upload',
      },
    })

    expectTypeOf(uploadResult).toMatchTypeOf<{
      code?: number
      type?: string
      message?: string
    }>()

    const updateResult = await $pets('/pet/{petId}/updateForm', {
      method: 'post',
      path: { petId: 1 },
      body: {
        name: 'Updated Pet Name',
      },
    })

    expectTypeOf(updateResult).toMatchTypeOf<ReturnData>()
  })
})
