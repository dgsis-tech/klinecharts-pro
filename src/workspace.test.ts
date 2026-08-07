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
  WORKSPACE_SCHEMA_VERSION,
  emptyWorkspace,
  normalizeWorkspace
} from './workspace'

describe('workspace', () => {
  it('emptyWorkspace uses schema v1', () => {
    const ws = emptyWorkspace()
    expect(ws.schemaVersion).toBe(WORKSPACE_SCHEMA_VERSION)
    expect(ws.indicators).toEqual([])
    expect(ws.overlays).toEqual([])
  })

  it('normalizeWorkspace round-trips serializable fields', () => {
    const raw = {
      schemaVersion: 1,
      theme: 'dark',
      locale: 'en',
      timezone: 'UTC',
      drawingBarVisible: false,
      symbol: { ticker: 'inst_bybit_btcusdt' },
      period: { multiplier: 1, timespan: 'hour', text: '1h' },
      indicators: [{ name: 'MA', paneId: 'candle_pane', calcParams: [5, 10] }],
      overlays: [{ name: 'segment', points: [{ timestamp: 1, value: 2 }] }]
    }
    const ws = normalizeWorkspace(raw)
    expect(ws).toEqual(raw)
    const again = normalizeWorkspace(JSON.parse(JSON.stringify(ws)))
    expect(again.indicators[0].calcParams).toEqual([5, 10])
    expect(again.overlays[0].points[0].timestamp).toBe(1)
  })

  it('normalizeWorkspace tolerates junk', () => {
    expect(normalizeWorkspace(null).schemaVersion).toBe(1)
    expect(normalizeWorkspace({ indicators: 'x' }).indicators).toEqual([])
  })
})
