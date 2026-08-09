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

import { periodsEqual, symbolsEqual, SymbolPeriodReloadGate } from './symbolPeriodReload'

describe('symbolPeriodReload', () => {
  it('periodsEqual / symbolsEqual', () => {
    expect(periodsEqual(
      { multiplier: 1, timespan: 'hour', text: '1h' },
      { multiplier: 1, timespan: 'hour', text: '1h' }
    )).toBe(true)
    expect(periodsEqual(
      { multiplier: 1, timespan: 'hour', text: '1h' },
      { multiplier: 4, timespan: 'hour', text: '4h' }
    )).toBe(false)
    expect(symbolsEqual({ ticker: 'BTC' }, { ticker: 'BTC', name: 'Bitcoin' })).toBe(true)
    expect(symbolsEqual({ ticker: 'BTC' }, { ticker: 'ETH' })).toBe(false)
  })

  it('history begin invalidates loadMore; rapid history keeps latest gen', () => {
    const gate = new SymbolPeriodReloadGate()
    const load = gate.beginLoadMore()
    expect(gate.isLoadMoreCurrent(load)).toBe(true)
    const h1 = gate.beginHistory()
    expect(gate.isLoadMoreCurrent(load)).toBe(false)
    expect(gate.isHistoryCurrent(h1)).toBe(true)
    const h2 = gate.beginHistory()
    expect(gate.isHistoryCurrent(h1)).toBe(false)
    expect(gate.isHistoryCurrent(h2)).toBe(true)
    const load2 = gate.beginLoadMore()
    expect(gate.isLoadMoreCurrent(load2)).toBe(true)
    gate.beginHistory()
    expect(gate.isLoadMoreCurrent(load2)).toBe(false)
  })
})
