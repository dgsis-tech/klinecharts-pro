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

import { Chart, DeepPartial, OverlayMode, Styles, Nullable } from 'klinecharts'

import { Period, SymbolInfo } from './types'

/** Workspace JSON schema version for Candlex KLP persistence (v0). */
export const WORKSPACE_SCHEMA_VERSION = 1

export interface WorkspaceIndicator {
  name: string
  paneId: string
  calcParams?: any[]
  visible?: boolean
  shortName?: string
  precision?: number
}

export interface WorkspaceOverlay {
  id?: string
  name: string
  paneId?: string
  groupId?: string
  points: Array<{ timestamp?: number, dataIndex?: number, value?: number }>
  lock?: boolean
  visible?: boolean
  zLevel?: number
  mode?: OverlayMode | string
  extendData?: any
  styles?: any
}

/**
 * Serializable chart workspace (indicators + overlays + settings).
 * Does not include OHLC bars.
 */
export interface ChartWorkspace {
  schemaVersion: number
  theme?: string
  locale?: string
  timezone?: string
  drawingBarVisible?: boolean
  symbol?: SymbolInfo
  period?: Period
  styles?: DeepPartial<Styles>
  indicators: WorkspaceIndicator[]
  overlays: WorkspaceOverlay[]
}

export function emptyWorkspace (): ChartWorkspace {
  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    indicators: [],
    overlays: []
  }
}

function isCandlePane (paneId: string): boolean {
  return paneId === 'candle_pane'
}

/**
 * Read indicators from a klinecharts Chart instance into workspace rows.
 */
export function collectIndicators (chart: Chart): WorkspaceIndicator[] {
  const root = chart.getIndicatorByPaneId() as Map<string, Map<string, any>>
  const out: WorkspaceIndicator[] = []
  if (!root || typeof root.forEach !== 'function') {
    return out
  }
  root.forEach((byName, paneId) => {
    if (!byName || typeof byName.forEach !== 'function') {
      return
    }
    byName.forEach((indicator, name) => {
      out.push({
        name: name || indicator?.name,
        paneId,
        calcParams: Array.isArray(indicator?.calcParams) ? [...indicator.calcParams] : undefined,
        visible: indicator?.visible,
        shortName: indicator?.shortName,
        precision: indicator?.precision
      })
    })
  })
  return out
}

/**
 * Read overlays by tracked ids (klinecharts has no public list-all API).
 */
export function collectOverlays (chart: Chart, overlayIds: Iterable<string>): WorkspaceOverlay[] {
  const out: WorkspaceOverlay[] = []
  for (const id of overlayIds) {
    const ov = chart.getOverlayById(id)
    if (!ov) {
      continue
    }
    out.push({
      id: ov.id,
      name: ov.name,
      paneId: ov.paneId,
      groupId: ov.groupId,
      points: (ov.points ?? []).map(p => ({
        timestamp: p.timestamp,
        dataIndex: p.dataIndex,
        value: p.value
      })),
      lock: ov.lock,
      visible: ov.visible,
      zLevel: ov.zLevel,
      mode: ov.mode,
      extendData: ov.extendData,
      styles: ov.styles ?? undefined
    })
  }
  return out
}

export function buildWorkspace (params: {
  chart: Chart
  overlayIds: Iterable<string>
  theme?: string
  locale?: string
  timezone?: string
  drawingBarVisible?: boolean
  symbol?: SymbolInfo
  period?: Period
}): ChartWorkspace {
  const { chart } = params
  let styles: DeepPartial<Styles> | undefined
  try {
    styles = JSON.parse(JSON.stringify(chart.getStyles())) as DeepPartial<Styles>
  } catch {
    styles = undefined
  }
  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    theme: params.theme,
    locale: params.locale,
    timezone: params.timezone,
    drawingBarVisible: params.drawingBarVisible,
    symbol: params.symbol,
    period: params.period,
    styles,
    indicators: collectIndicators(chart),
    overlays: collectOverlays(chart, params.overlayIds)
  }
}

/**
 * Remove all indicators from the chart (best-effort).
 */
export function clearIndicators (chart: Chart): void {
  const root = chart.getIndicatorByPaneId() as Map<string, Map<string, any>>
  if (!root || typeof root.forEach !== 'function') {
    return
  }
  const removals: Array<{ paneId: string, name: string }> = []
  root.forEach((byName, paneId) => {
    if (!byName || typeof byName.forEach !== 'function') {
      return
    }
    byName.forEach((_ind, name) => {
      removals.push({ paneId, name })
    })
  })
  removals.forEach(({ paneId, name }) => {
    try {
      chart.removeIndicator(paneId, name)
    } catch {
      // ignore
    }
  })
}

/**
 * Remove tracked overlays.
 */
export function clearOverlays (chart: Chart, overlayIds: Iterable<string>): void {
  for (const id of overlayIds) {
    try {
      chart.removeOverlay(id)
    } catch {
      // ignore
    }
  }
}

export function applyIndicators (
  chart: Chart,
  indicators: WorkspaceIndicator[],
  createWithTooltip: (name: string, isStack: boolean, paneOptions?: { id?: string }) => Nullable<string>
): { main: string[], sub: Record<string, string> } {
  const main: string[] = []
  const sub: Record<string, string> = {}
  indicators.forEach(ind => {
    if (!ind?.name) {
      return
    }
    const onCandle = isCandlePane(ind.paneId) || !ind.paneId
    const paneId = createWithTooltip(
      ind.name,
      true,
      onCandle ? { id: 'candle_pane' } : undefined
    )
    if (!paneId) {
      return
    }
    if (onCandle) {
      main.push(ind.name)
    } else {
      sub[ind.name] = paneId
    }
    const override: any = { name: ind.name }
    if (ind.calcParams) {
      override.calcParams = ind.calcParams
    }
    if (typeof ind.visible === 'boolean') {
      override.visible = ind.visible
    }
    try {
      chart.overrideIndicator(override, onCandle ? 'candle_pane' : paneId)
    } catch {
      // ignore
    }
  })
  return { main, sub }
}

export function applyOverlays (chart: Chart, overlays: WorkspaceOverlay[]): string[] {
  const ids: string[] = []
  overlays.forEach(ov => {
    if (!ov?.name) {
      return
    }
    const created = chart.createOverlay({
      name: ov.name,
      id: ov.id,
      groupId: ov.groupId,
      points: ov.points,
      lock: ov.lock,
      visible: ov.visible,
      zLevel: ov.zLevel,
      mode: ov.mode as OverlayMode,
      extendData: ov.extendData,
      styles: ov.styles
    }, ov.paneId)
    if (typeof created === 'string' && created) {
      ids.push(created)
    } else if (Array.isArray(created)) {
      created.forEach(id => {
        if (id) {
          ids.push(id)
        }
      })
    }
  })
  return ids
}

/**
 * Normalize / validate inbound workspace JSON (host or tests).
 */
export function normalizeWorkspace (raw: any): ChartWorkspace {
  if (!raw || typeof raw !== 'object') {
    return emptyWorkspace()
  }
  const schemaVersion = Number(raw.schemaVersion) || WORKSPACE_SCHEMA_VERSION
  return {
    schemaVersion,
    theme: typeof raw.theme === 'string' ? raw.theme : undefined,
    locale: typeof raw.locale === 'string' ? raw.locale : undefined,
    timezone: typeof raw.timezone === 'string' ? raw.timezone : undefined,
    drawingBarVisible: typeof raw.drawingBarVisible === 'boolean' ? raw.drawingBarVisible : undefined,
    symbol: raw.symbol && typeof raw.symbol === 'object' ? raw.symbol : undefined,
    period: raw.period && typeof raw.period === 'object' ? raw.period : undefined,
    styles: raw.styles && typeof raw.styles === 'object' ? raw.styles : undefined,
    indicators: Array.isArray(raw.indicators) ? raw.indicators : [],
    overlays: Array.isArray(raw.overlays) ? raw.overlays : []
  }
}
