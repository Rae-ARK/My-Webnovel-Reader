/* @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const mockRoute = vi.hoisted(() => ({ params: { slug: '' } as Record<string, string> }))

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

vi.mock('../../../config/site', () => ({
  default: {
    legal: {
      privacyPolicy: 'Privacy paragraph one.\n\nPrivacy paragraph two.',
      termsAndConditions: 'Terms text.',
      codeOfConduct: 'Conduct text.',
    },
  },
}))

import LegalPageView from '../LegalPageView.vue'

describe('LegalPageView', () => {
  it('renders the Privacy Policy content, split into paragraphs', () => {
    mockRoute.params.slug = 'privacy-policy'

    const wrapper = mount(LegalPageView)

    expect(wrapper.find('h1').text()).toBe('Privacy Policy')
    const paragraphs = wrapper.findAll('.legal-content p')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]?.text()).toBe('Privacy paragraph one.')
    expect(paragraphs[1]?.text()).toBe('Privacy paragraph two.')
  })

  it('renders Terms & Conditions content for the terms slug', () => {
    mockRoute.params.slug = 'terms'

    const wrapper = mount(LegalPageView)

    expect(wrapper.find('h1').text()).toBe('Terms & Conditions')
    expect(wrapper.text()).toContain('Terms text.')
  })

  it('renders Code of Conduct content for the code-of-conduct slug', () => {
    mockRoute.params.slug = 'code-of-conduct'

    const wrapper = mount(LegalPageView)

    expect(wrapper.find('h1').text()).toBe('Code of Conduct')
    expect(wrapper.text()).toContain('Conduct text.')
  })

  it('falls back to a not-found message for an unknown slug', () => {
    mockRoute.params.slug = 'something-else'

    const wrapper = mount(LegalPageView)

    expect(wrapper.find('h1').text()).toBe('Page not found')
    expect(wrapper.findAll('.legal-content p')).toHaveLength(0)
  })
})
