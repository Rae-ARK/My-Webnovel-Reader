/* @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchView from '../SearchView.vue'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  search: vi.fn(),
  routeQuery: {} as Record<string, string | string[] | undefined>,
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: mocks.routeQuery,
  }),
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
  }),
}))

vi.mock('../../container', () => ({
  appContainer: {
    searchService: {
      search: mocks.search,
    },
  },
}))

describe('SearchView', () => {
  beforeEach(() => {
    mocks.push.mockReset()
    mocks.replace.mockReset()
    mocks.search.mockReset()
    mocks.routeQuery = {}

    mocks.search.mockImplementation((query: string) => {
      if (query.toLowerCase().includes('tomorrow')) {
        return [
          {
            fictionId: 'fiction-1',
            entryId: 'entry-3',
            entryNumber: 3,
            entryType: 'chapter',
            entryTitle: 'Tomorrow',
            fictionTitle: 'The Moonlit Archive',
            snippet: "A book with tomorrow's date.",
          },
        ]
      }

      return []
    })
  })

  it('loads an existing query from the URL', () => {
    mocks.routeQuery = { q: 'tomorrow' }

    const wrapper = mount(SearchView)

    expect(wrapper.find('input').element.value).toBe('tomorrow')
    expect(mocks.search).toHaveBeenCalledWith('tomorrow')
    expect(wrapper.text()).toContain('The Moonlit Archive')
  })

  it('renders the search page', () => {
    const wrapper = mount(SearchView)

    expect(wrapper.text()).toContain('Search')
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('searches and displays matching results', async () => {
    const wrapper = mount(SearchView)

    await wrapper.find('input').setValue('  tomorrow  ')
    await wrapper.find('form').trigger('submit')

    expect(mocks.search).toHaveBeenCalledWith('tomorrow')
    expect(wrapper.text()).toContain('The Moonlit Archive')
    expect(wrapper.text()).toContain('Tomorrow')
  })

  it('updates the URL when a search is submitted', async () => {
    const wrapper = mount(SearchView)

    await wrapper.find('input').setValue('moon')
    await wrapper.find('form').trigger('submit')

    expect(mocks.replace).toHaveBeenCalledWith({
      path: '/search',
      query: { q: 'moon' },
    })
  })

  it('navigates to the matching entry when a result is clicked', async () => {
    const wrapper = mount(SearchView)

    await wrapper.find('input').setValue('tomorrow')
    await wrapper.find('form').trigger('submit')
    await wrapper.find('button.result-card').trigger('click')

    expect(mocks.push).toHaveBeenCalledWith(
      '/read/fiction-1/entry-3',
    )
  })

  it('renders the no-results state', async () => {
    const wrapper = mount(SearchView)

    await wrapper.find('input').setValue('missing')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('No results found')
  })

  it('clears the search when submitted empty', async () => {
    const wrapper = mount(SearchView)

    await wrapper.find('input').setValue('   ')
    await wrapper.find('form').trigger('submit')

    expect(mocks.search).not.toHaveBeenCalled()
    expect(mocks.replace).toHaveBeenCalledWith({
      path: '/search',
    })
  })
})
