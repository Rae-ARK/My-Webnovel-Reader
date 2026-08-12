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

import SiteFooter from '../SiteFooter.vue'

const baseConfig = {
  site: {
    title: 'Web Novel Reader',
    author: 'Author Name',
    description: 'A read-only web novel library.',
    icon: '/icon.svg',
    about: 'Generic template about copy.',
  },
  contact: {
    email: 'contact@example.com',
    subjectTemplate: 'Message from a reader',
  },
  support: {
    issuesUrl: 'https://github.com/Rae-ARK/My-Webnovel-Reader/issues',
  },
  social: [{ platform: 'github', url: 'https://github.com/Rae-ARK/My-Webnovel-Reader' }],
  advertising: undefined as { html: string } | undefined,
}

describe('SiteFooter', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders defaults-only for a fully unconfigured site', () => {
    mockSite.value = baseConfig

    const wrapper = mount(SiteFooter)

    // About boilerplate
    expect(wrapper.text()).toContain('Generic template about copy.')

    // Only the default GitHub social link, nothing else
    expect(wrapper.text()).toContain('GitHub')

    // No advertising column at all
    expect(wrapper.find('#footer-advertising-heading').exists()).toBe(false)

    // Report an Issue and Contact columns are always present
    expect(wrapper.find('#footer-support-heading').exists()).toBe(true)
    expect(wrapper.find('#footer-contact-heading').exists()).toBe(true)
    expect(wrapper.find('a[href^="mailto:contact@example.com"]').exists()).toBe(true)
  })

  it('renders every column when fully configured', () => {
    mockSite.value = {
      ...baseConfig,
      social: [
        { platform: 'github', url: 'https://github.com/example/repo' },
        { platform: 'twitter', url: 'https://x.com/example' },
        { platform: 'discord', url: 'https://discord.gg/example' },
      ],
      advertising: { html: '<div class="ad">Sponsored</div>' },
    }

    const wrapper = mount(SiteFooter)

    expect(wrapper.find('#footer-advertising-heading').exists()).toBe(true)
    expect(wrapper.html()).toContain('Sponsored')
    expect(wrapper.text()).toContain('GitHub')
    expect(wrapper.text()).toContain('Twitter / X')
    expect(wrapper.text()).toContain('Discord')
  })

  it('renders only the configured socials and no advertising when partially configured', () => {
    mockSite.value = {
      ...baseConfig,
      social: [
        { platform: 'github', url: 'https://github.com/example/repo' },
        { platform: 'kofi', url: 'https://ko-fi.com/example' },
      ],
      advertising: undefined,
    }

    const wrapper = mount(SiteFooter)

    expect(wrapper.text()).toContain('GitHub')
    expect(wrapper.text()).toContain('Ko-fi')
    expect(wrapper.text()).not.toContain('Discord')
    expect(wrapper.find('#footer-advertising-heading').exists()).toBe(false)
  })
})
