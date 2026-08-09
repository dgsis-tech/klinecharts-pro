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

import { Period, SymbolInfo } from './types'

export function periodsEqual (a: Period, b: Period): boolean {
  return a.multiplier === b.multiplier && a.timespan === b.timespan && a.text === b.text
}

export function symbolsEqual (a: SymbolInfo, b: SymbolInfo): boolean {
  return a.ticker === b.ticker
}

/**
 * Generation tokens so history reload and loadMore never share a blocking `loading`
 * flag that silently drops setPeriod/setSymbol (REQ-003).
 */
export class SymbolPeriodReloadGate {
  private historyGen = 0
  private loadMoreGen = 0

  /** Start a history reload; invalidates in-flight loadMore. */
  beginHistory (): number {
    this.loadMoreGen++
    return ++this.historyGen
  }

  isHistoryCurrent (gen: number): boolean {
    return gen === this.historyGen
  }

  beginLoadMore (): { loadMoreGen: number, historyGen: number } {
    return { loadMoreGen: ++this.loadMoreGen, historyGen: this.historyGen }
  }

  isLoadMoreCurrent (token: { loadMoreGen: number, historyGen: number }): boolean {
    return token.loadMoreGen === this.loadMoreGen && token.historyGen === this.historyGen
  }
}
