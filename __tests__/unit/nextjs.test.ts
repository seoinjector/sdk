/**
 * Tests for Next.js getMetadata Adapter
 */

import {
  getMetadata,
  withMetadata,
  resetSEOInstance,
} from '../../src/integrations/nextjs/getMetadata'
import { SEOInjector } from '../../src/client'
import type { Metadata } from '../../src/types'

// Mock SEOInjector
jest.mock('../../src/client')

const mockMetadata: Metadata = {
  title: 'Product Page',
  description: 'Product Description',
}

function setupMockSEO() {
  const mockSEO = new SEOInjector('test_key') as jest.Mocked<SEOInjector>

  mockSEO.setUrl = jest.fn().mockReturnValue(mockSEO)
  mockSEO.setLanguage = jest.fn().mockReturnValue(mockSEO)
  mockSEO.setContext = jest.fn().mockReturnValue(mockSEO)
  mockSEO.get = jest.fn().mockResolvedValue(mockMetadata)
  mockSEO.getDynamic = jest.fn().mockResolvedValue(mockMetadata)

  ;(SEOInjector as jest.MockedClass<typeof SEOInjector>).mockImplementation(
    () => mockSEO
  )

  return mockSEO
}

describe('Next.js: getMetadata Adapter', () => {
  let mockSEO: jest.Mocked<SEOInjector>

  beforeEach(() => {
    jest.clearAllMocks()
    resetSEOInstance()
    mockSEO = setupMockSEO()
  })

  it('should fetch static metadata', async () => {
    const metadata = await getMetadata('test_key', {
      url: '/about',
    })

    expect(metadata).toEqual(mockMetadata)
    expect(mockSEO.get).toHaveBeenCalled()
  })

  it('should fetch dynamic metadata with context', async () => {
    const context = { productId: '123' }

    const metadata = await getMetadata('test_key', {
      url: '/products/123',
      context,
    })

    expect(metadata).toEqual(mockMetadata)
    expect(mockSEO.getDynamic).toHaveBeenCalled()
    expect(mockSEO.setContext).toHaveBeenCalledWith(context)
  })

  it('should set URL correctly', async () => {
    await getMetadata('test_key', {
      url: '/products/456',
    })

    expect(mockSEO.setUrl).toHaveBeenCalledWith('/products/456')
  })

  it('should return null on error and log expected failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockSEO.get = jest
      .fn()
      .mockRejectedValue(new Error('API error'))

    const metadata = await getMetadata('test_key', {
      url: '/error',
    })

    expect(metadata).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SEO Injector] Failed to fetch metadata'),
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })
})

describe('Next.js: withMetadata HOC', () => {
  let mockSEO: jest.Mocked<SEOInjector>

  beforeEach(() => {
    jest.clearAllMocks()
    resetSEOInstance()
    mockSEO = setupMockSEO()
  })

  it('should wrap handler and add metadata to props', async () => {
    const handler = jest.fn().mockResolvedValue({
      props: { title: 'Product' },
    })

    const getOptions = jest.fn().mockReturnValue({
      apiKey: 'test_key',
      url: '/products/1',
    })

    const wrapped = withMetadata(handler, getOptions)
    const result = await wrapped({})

    expect(handler).toHaveBeenCalled()
    expect(getOptions).toHaveBeenCalled()
    expect(result.props).toHaveProperty('metadata')
    expect(result.props.metadata).toEqual(mockMetadata)
  })

  it('should preserve original props', async () => {
    const handler = jest.fn().mockResolvedValue({
      props: { title: 'Product', price: '$99' },
    })

    const getOptions = jest.fn().mockReturnValue({
      apiKey: 'test_key',
      url: '/products/1',
    })

    const wrapped = withMetadata(handler, getOptions)
    const result = await wrapped({})

    expect(result.props.title).toBe('Product')
    expect(result.props.price).toBe('$99')
    expect(result.props.metadata).toEqual(mockMetadata)
  })
})
