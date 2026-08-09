/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, it } from 'vitest'

import {
  CURATED_TIMEZONE_KEYS,
  DEFAULT_CURATED_TIMEZONE,
  resolveTimezoneKey,
  resolveTimezoneSelectOptions
} from './widget/timezone-modal/data'

describe('timezone curated (REQ-005)', () => {
  it('curated keys are UTC / New York / Madrid IANA', () => {
    expect([...CURATED_TIMEZONE_KEYS]).toEqual([
      'Etc/UTC',
      'America/New_York',
      'Europe/Madrid'
    ])
  })

  it('resolveTimezoneKey defaults to Etc/UTC when curated and omitted', () => {
    expect(resolveTimezoneKey(undefined, { curated: true })).toBe(DEFAULT_CURATED_TIMEZONE)
    expect(resolveTimezoneKey('', { curated: true })).toBe('Etc/UTC')
  })

  it('resolveTimezoneKey keeps allowed curated keys', () => {
    expect(resolveTimezoneKey('America/New_York', { curated: true })).toBe('America/New_York')
    expect(resolveTimezoneKey('Europe/Madrid', { curated: true })).toBe('Europe/Madrid')
  })

  it('resolveTimezoneKey falls back for out-of-list workspace TZ when curated', () => {
    expect(resolveTimezoneKey('Asia/Shanghai', { curated: true })).toBe('Etc/UTC')
    expect(resolveTimezoneKey('Europe/Berlin', { curated: true })).toBe('Etc/UTC')
  })

  it('unrestricted keeps legacy Shanghai default when omitted', () => {
    expect(resolveTimezoneKey(undefined, { curated: false })).toBe('Asia/Shanghai')
    expect(resolveTimezoneKey('Europe/London', {})).toBe('Europe/London')
  })

  it('resolveTimezoneSelectOptions curated length is 3', () => {
    const opts = resolveTimezoneSelectOptions('en-US', { curated: true })
    expect(opts).toHaveLength(3)
    expect(opts.map(o => o.key)).toEqual([...CURATED_TIMEZONE_KEYS])
    expect(opts.map(o => o.text)).toEqual(['UTC', 'New York', 'Madrid'])
  })

  it('explicit timezoneSelectOptions wins over curated', () => {
    const opts = resolveTimezoneSelectOptions('en-US', {
      curated: true,
      timezoneSelectOptions: [{ key: 'Etc/UTC', text: 'UTC only' }]
    })
    expect(opts).toEqual([{ key: 'Etc/UTC', text: 'UTC only' }])
  })
})
