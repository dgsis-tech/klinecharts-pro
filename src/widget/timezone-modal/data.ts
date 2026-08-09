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

import i18n from '../../i18n'

import { SelectDataSourceItem } from '../../component'

/** Candlex D-31 curated IANA keys (REQ-005). */
export const CURATED_TIMEZONE_KEYS = [
  'Etc/UTC',
  'America/New_York',
  'Europe/Madrid'
] as const

export type CuratedTimezoneKey = typeof CURATED_TIMEZONE_KEYS[number]

export const DEFAULT_CURATED_TIMEZONE: CuratedTimezoneKey = 'Etc/UTC'

export function translateTimezone (timezone: string, locale: string): string {
  switch (timezone) {
    case 'Etc/UTC': return i18n('utc', locale)
    case 'Pacific/Honolulu': return i18n('honolulu', locale)
    case 'America/Juneau': return i18n('juneau', locale)
    case 'America/Los_Angeles': return i18n('los_angeles', locale)
    case 'America/Chicago': return i18n('chicago', locale)
    case 'America/Toronto': return i18n('toronto', locale)
    case 'America/Sao_Paulo': return i18n('sao_paulo', locale)
    case 'America/New_York': return i18n('new_york', locale)
    case 'Europe/London': return i18n('london', locale)
    case 'Europe/Berlin': return i18n('berlin', locale)
    case 'Europe/Madrid': return i18n('madrid', locale)
    case 'Asia/Bahrain': return i18n('bahrain', locale)
    case 'Asia/Dubai': return i18n('dubai', locale)
    case 'Asia/Ashkhabad': return i18n('ashkhabad', locale)
    case 'Asia/Almaty': return i18n('almaty', locale)
    case 'Asia/Bangkok': return i18n('bangkok', locale)
    case 'Asia/Shanghai': return i18n('shanghai', locale)
    case 'Asia/Tokyo': return i18n('tokyo', locale)
    case 'Australia/Sydney': return i18n('sydney', locale)
    case 'Pacific/Norfolk': return i18n('norfolk', locale)
  }
  return timezone
}

export function createTimezoneSelectOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'Etc/UTC', text: i18n('utc', locale) },
    { key: 'Pacific/Honolulu', text: i18n('honolulu', locale) },
    { key: 'America/Juneau', text: i18n('juneau', locale) },
    { key: 'America/Los_Angeles', text: i18n('los_angeles', locale) },
    { key: 'America/Chicago', text: i18n('chicago', locale) },
    { key: 'America/Toronto', text: i18n('toronto', locale) },
    { key: 'America/Sao_Paulo', text: i18n('sao_paulo', locale) },
    { key: 'America/New_York', text: i18n('new_york', locale) },
    { key: 'Europe/London', text: i18n('london', locale) },
    { key: 'Europe/Berlin', text: i18n('berlin', locale) },
    { key: 'Europe/Madrid', text: i18n('madrid', locale) },
    { key: 'Asia/Bahrain', text: i18n('bahrain', locale) },
    { key: 'Asia/Dubai', text: i18n('dubai', locale) },
    { key: 'Asia/Ashkhabad', text: i18n('ashkhabad', locale) },
    { key: 'Asia/Almaty', text: i18n('almaty', locale) },
    { key: 'Asia/Bangkok', text: i18n('bangkok', locale) },
    { key: 'Asia/Shanghai', text: i18n('shanghai', locale) },
    { key: 'Asia/Tokyo', text: i18n('tokyo', locale) },
    { key: 'Australia/Sydney', text: i18n('sydney', locale) },
    { key: 'Pacific/Norfolk', text: i18n('norfolk', locale) }
  ]
}

/** Candlex curated modal list: UTC / New York / Madrid. */
export function createCuratedTimezoneSelectOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'Etc/UTC', text: i18n('utc', locale) },
    { key: 'America/New_York', text: i18n('new_york', locale) },
    { key: 'Europe/Madrid', text: i18n('madrid', locale) }
  ]
}

export interface ResolveTimezoneOptions {
  /** When true, allow only curated keys (unless `allowedKeys` overrides). */
  curated?: boolean
  /** Explicit allow-list (from `timezoneSelectOptions`). */
  allowedKeys?: string[]
  /** Fallback when missing or outside allow-list. Default `Etc/UTC` when curated/restricted. */
  fallback?: string
  /** Package default when unrestricted and key omitted. Default `Asia/Shanghai`. */
  unrestrictedDefault?: string
}

/**
 * Resolve a timezone key for constructor / setTimezone / workspace import.
 * Out-of-list keys under curated/restricted mode fall back to Etc/UTC (no crash).
 */
export function resolveTimezoneKey (
  key: string | undefined | null,
  opts: ResolveTimezoneOptions = {}
): string {
  const restricted = opts.curated === true || (Array.isArray(opts.allowedKeys) && opts.allowedKeys.length > 0)
  const allowed = opts.allowedKeys && opts.allowedKeys.length > 0
    ? opts.allowedKeys
    : (opts.curated === true ? [...CURATED_TIMEZONE_KEYS] : undefined)
  const curatedFallback = opts.fallback ?? DEFAULT_CURATED_TIMEZONE
  const unrestrictedDefault = opts.unrestrictedDefault ?? 'Asia/Shanghai'

  if (!restricted) {
    return (typeof key === 'string' && key) ? key : unrestrictedDefault
  }

  if (typeof key === 'string' && key && allowed!.includes(key)) {
    return key
  }
  return curatedFallback
}

export function resolveTimezoneSelectOptions (
  locale: string,
  opts: {
    curated?: boolean
    timezoneSelectOptions?: Array<{ key: string, text: string }>
  }
): SelectDataSourceItem[] {
  if (opts.timezoneSelectOptions && opts.timezoneSelectOptions.length > 0) {
    return opts.timezoneSelectOptions.map(o => ({ key: o.key, text: o.text }))
  }
  if (opts.curated) {
    return createCuratedTimezoneSelectOptions(locale)
  }
  return createTimezoneSelectOptions(locale)
}
