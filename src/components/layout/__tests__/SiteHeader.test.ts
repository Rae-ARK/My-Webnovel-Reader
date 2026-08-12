/* @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const mockSite = vi.hoisted(() => ({ value: null as unknown }))

vi.mock('../../../config/site', () => ({
  default: new Proxy(
    {},
    {
      get(_target, prop) {
        return (mockSite.value as Record<string, unknown>)[prop as string]
      },
    },
  ),
}))

import SiteHeader from '../SiteHeader.vue'

const mountOptions = {
  global: {
    stubs: {
      RouterLink: {
        props: ['to'],
        template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>',
      },
    },
  },
}

const baseConfig = {
  site: {
    title: 'Web Novel Reader',
    icon: '/icon.svg',
  },
}

describe('SiteHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.localStorage.clear()
  })

  it('renders the site title and brand icon from config', () => {
    mockSite.value = baseConfig

    const wrapper = mount(SiteHeader, mountOptions)

    expect(wrapper.text()).toContain('Web Novel Reader')
    expect(wrapper.find('img.brand-icon').attributes('src')).toBe('/icon.svg')
  })

  it('links the brand to the home route', () => {
    mockSite.value = baseConfig

    const wrapper = mount(SiteHeader, mountOptions)

    expect(wrapper.find('a.brand').attributes('href')).toBe('/')
  })

  it('renders Library and Search navigation links', () => {
    mockSite.value = baseConfig

    const wrapper = mount(SiteHeader, mountOptions)
    const navLinks = wrapper.findAll('nav a')

    expect(navLinks).toHaveLength(2)
    expect(navLinks[0]?.attributes('href')).toBe('/library')
    expect(navLinks[0]?.text()).toBe('Library')
    expect(navLinks[1]?.attributes('href')).toBe('/search')
    expect(navLinks[1]?.text()).toBe('Search')
  })

  it('renders a theme toggle defaulting to light, labeled for the next theme', () => {
    mockSite.value = baseConfig

    const wrapper = mount(SiteHeader, mountOptions)
    const toggle = wrapper.find('.theme-toggle')

    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('aria-label')).toBe('Switch to cream theme')
    expect(toggle.text()).toBe('☀')
  })

  it('cycles light → cream → dark → light on repeated clicks', async () => {
    mockSite.value = baseConfig

    const wrapper = mount(SiteHeader, mountOptions)
    const toggle = wrapper.find('.theme-toggle')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-label')).toBe('Switch to dark theme')
    expect(toggle.text()).toBe('◐')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-label')).toBe('Switch to light theme')
    expect(toggle.text()).toBe('☾')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-label')).toBe('Switch to cream theme')
    expect(toggle.text()).toBe('☀')
  })
})
