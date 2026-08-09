/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { KLineData, Styles, DeepPartial, IndicatorStyle, OverlayStyle } from 'klinecharts'

import type { ChartWorkspace } from './workspace'

/** Host override payload for ChartPro.overrideIndicator (forwards to klinecharts). */
export interface IndicatorOverride {
  name: string
  calcParams?: unknown[]
  visible?: boolean
  styles?: DeepPartial<IndicatorStyle>
  shortName?: string
  precision?: number
  [key: string]: unknown
}

/** Host overlay create payload (forwards to klinecharts createOverlay + workspace tracking). */
export interface OverlayCreateInput {
  name: string
  id?: string
  groupId?: string
  points?: Array<{ timestamp?: number, dataIndex?: number, value?: number }>
  lock?: boolean
  visible?: boolean
  zLevel?: number
  mode?: string
  extendData?: unknown
  styles?: DeepPartial<OverlayStyle> | Record<string, unknown>
  [key: string]: unknown
}

export interface SymbolInfo {
  ticker: string
  name?: string
  shortName?: string
  exchange?: string
  market?: string
  pricePrecision?: number
  volumePrecision?: number
  priceCurrency?: string
  type?: string
  logo?: string
}

export interface Period {
  multiplier: number
  timespan: string
  text: string
}

export type DatafeedSubscribeCallback = (data: KLineData) => void

export interface Datafeed {
  searchSymbols (search?: string): Promise<SymbolInfo[]>
  getHistoryKLineData (symbol: SymbolInfo, period: Period, from: number, to: number): Promise<KLineData[]>
  subscribe (symbol: SymbolInfo, period: Period, callback: DatafeedSubscribeCallback): void
  unsubscribe (symbol: SymbolInfo, period: Period): void
}

export interface ChartProOptions {
  container: string | HTMLElement
  styles?: DeepPartial<Styles>
  watermark?: string | Node
  theme?: string
  locale?: string
  drawingBarVisible?: boolean
  symbol: SymbolInfo
  period: Period
  periods?: Period[]
  timezone?: string
  mainIndicators?: string[]
  subIndicators?: string[]
  datafeed: Datafeed
}

export interface ChartPro {
  setTheme(theme: string): void
  getTheme(): string
  setStyles(styles: DeepPartial<Styles>): void
  getStyles(): Styles
  setLocale(locale: string): void
  getLocale(): string
  setTimezone(timezone: string): void
  getTimezone(): string
  setSymbol(symbol: SymbolInfo): void
  getSymbol(): SymbolInfo
  setPeriod(period: Period): void
  getPeriod(): Period
  /** Candlex KLP: export indicators/overlays/settings (no OHLC). */
  exportWorkspace(): ChartWorkspace
  /** Candlex KLP: restore workspace; symbol/period applied when present. */
  importWorkspace(workspace: ChartWorkspace | Record<string, unknown>): void
  /** Notify host on indicator/overlay/settings mutations (for auto-save). */
  subscribeWorkspaceChange(callback: () => void): () => void
  /**
   * Override an indicator instance (calcParams and/or styles).
   * Forwards to klinecharts Chart.overrideIndicator; notifies workspace listeners.
   */
  overrideIndicator(override: IndicatorOverride, paneId?: string): void
  /** Read indicators by pane (wraps klinecharts getIndicatorByPaneId). */
  getIndicatorByPaneId(paneId?: string, name?: string): unknown
  /**
   * Create an overlay and track its id for workspace export.
   * Returns the overlay id, or null on failure.
   */
  createOverlay(overlay: OverlayCreateInput | string, paneId?: string): string | null
  /** Update an existing overlay (points/styles/extendData/…). */
  overrideOverlay(override: { id: string } & Record<string, unknown>): void
  /** Remove overlay by id and drop it from workspace tracking. */
  removeOverlay(id: string): void
}

