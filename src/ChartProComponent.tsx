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

import { createSignal, createEffect, onMount, Show, onCleanup, startTransition, Component } from 'solid-js'

import {
  init, dispose, utils, Nullable, Chart, OverlayMode, Styles,
  TooltipIconPosition, ActionType, PaneOptions, Indicator, DomPosition, FormatDateType
} from 'klinecharts'

import lodashSet from 'lodash/set'
import lodashClone from 'lodash/cloneDeep'

import { SelectDataSourceItem, Loading } from './component'

import {
  PeriodBar, DrawingBar, IndicatorModal, TimezoneModal, SettingModal,
  ScreenshotModal, IndicatorSettingModal, SymbolSearchModal
} from './widget'

import { translateTimezone, resolveTimezoneKey, resolveTimezoneSelectOptions } from './widget/timezone-modal/data'

import { SymbolInfo, Period, ChartProOptions, ChartPro, PeriodBarOptions, TimezoneOption } from './types'
import {
  applyIndicators,
  applyOverlays,
  buildWorkspace,
  clearIndicators,
  clearOverlays,
  normalizeWorkspace,
  ChartWorkspace
} from './workspace'
import { periodsEqual, symbolsEqual, SymbolPeriodReloadGate } from './symbolPeriodReload'

export interface ChartProComponentProps extends Required<Omit<ChartProOptions, 'container' | 'periodBar' | 'timezoneCurated' | 'timezoneSelectOptions'>> {
  ref: (chart: ChartPro) => void
  periodBar?: PeriodBarOptions
  timezoneCurated?: boolean
  timezoneSelectOptions?: TimezoneOption[]
}

interface PrevSymbolPeriod {
  symbol: SymbolInfo
  period: Period
}

function createIndicator (widget: Nullable<Chart>, indicatorName: string, isStack?: boolean, paneOptions?: PaneOptions): Nullable<string> {
  if (indicatorName === 'VOL') {
    paneOptions = { gap: { bottom: 2 }, ...paneOptions }
  }
  return widget?.createIndicator({
    name: indicatorName,
    // @ts-expect-error
    createTooltipDataSource: ({ indicator, defaultStyles }) => {
      const icons = []
      if (indicator.visible) {
        icons.push(defaultStyles.tooltip.icons[1])
        icons.push(defaultStyles.tooltip.icons[2])
        icons.push(defaultStyles.tooltip.icons[3])
      } else {
        icons.push(defaultStyles.tooltip.icons[0])
        icons.push(defaultStyles.tooltip.icons[2])
        icons.push(defaultStyles.tooltip.icons[3])
      }
      return { icons }
    }
  }, isStack, paneOptions) ?? null
}

const ChartProComponent: Component<ChartProComponentProps> = props => {
  let widgetRef: HTMLDivElement | undefined = undefined
  let widget: Nullable<Chart> = null

  let priceUnitDom: HTMLElement

  const reloadGate = new SymbolPeriodReloadGate()
  let toolbarAccessoryEl: HTMLElement | null = null

  const tzResolveOpts = () => ({
    curated: props.timezoneCurated === true,
    allowedKeys: props.timezoneSelectOptions?.map(o => o.key)
  })

  const toTimezoneItem = (key: string): SelectDataSourceItem => {
    const resolved = resolveTimezoneKey(key, tzResolveOpts())
    return { key: resolved, text: translateTimezone(resolved, locale()) }
  }

  const [theme, setTheme] = createSignal(props.theme)
  const [styles, setStyles] = createSignal(props.styles)
  const [locale, setLocale] = createSignal(props.locale)

  const [symbol, setSymbol] = createSignal(props.symbol)
  const [period, setPeriod] = createSignal(props.period)
  const [indicatorModalVisible, setIndicatorModalVisible] = createSignal(false)
  const [mainIndicators, setMainIndicators] = createSignal([...(props.mainIndicators!)])
  const [subIndicators, setSubIndicators] = createSignal({})

  const [timezoneModalVisible, setTimezoneModalVisible] = createSignal(false)
  const [timezone, setTimezone] = createSignal<SelectDataSourceItem>(
    (() => {
      const resolved = resolveTimezoneKey(props.timezone, {
        curated: props.timezoneCurated === true,
        allowedKeys: props.timezoneSelectOptions?.map(o => o.key)
      })
      return { key: resolved, text: translateTimezone(resolved, props.locale) }
    })()
  )

  const [settingModalVisible, setSettingModalVisible] = createSignal(false)
  const [widgetDefaultStyles, setWidgetDefaultStyles] = createSignal<Styles>()

  const [screenshotUrl, setScreenshotUrl] = createSignal('')

  const [drawingBarVisible, setDrawingBarVisible] = createSignal(props.drawingBarVisible)

  const [symbolSearchModalVisible, setSymbolSearchModalVisible] = createSignal(false)

  const [loadingVisible, setLoadingVisible] = createSignal(false)

  const [indicatorSettingModalParams, setIndicatorSettingModalParams] = createSignal({
    visible: false, indicatorName: '', paneId: '', calcParams: [] as Array<any>
  })

  const overlayIds = new Set<string>()
  const workspaceListeners = new Set<() => void>()

  const notifyWorkspaceChange = (): void => {
    workspaceListeners.forEach(cb => {
      try { cb() } catch (e) {}
    })
  }

  const trackOverlayId = (id: Nullable<string> | Array<Nullable<string>>): void => {
    if (Array.isArray(id)) {
      id.forEach(i => { if (i) overlayIds.add(i) })
      return
    }
    if (id) {
      overlayIds.add(id)
    }
  }

  const createOverlayTracked = (overlay: any, paneId?: string): string | null => {
    const created = widget?.createOverlay(overlay, paneId) ?? null
    trackOverlayId(created as any)
    notifyWorkspaceChange()
    if (Array.isArray(created)) {
      const first = created.find(id => !!id)
      return first ?? null
    }
    return created
  }

  props.ref({
    setTheme,
    getTheme: () => theme(),
    setStyles,
    getStyles: () => widget!.getStyles(),
    setLocale,
    getLocale: () => locale(),
    setTimezone: (timezone: string) => { setTimezone(toTimezoneItem(timezone)) },
    getTimezone: () => timezone().key,
    setSymbol,
    getSymbol: () => symbol(),
    setPeriod,
    getPeriod: () => period(),
    exportWorkspace: (): ChartWorkspace => {
      if (!widget) {
        return normalizeWorkspace(null)
      }
      return buildWorkspace({
        chart: widget,
        overlayIds,
        theme: theme(),
        locale: locale(),
        timezone: timezone().key,
        drawingBarVisible: drawingBarVisible(),
        symbol: symbol(),
        period: period()
      })
    },
    importWorkspace: (raw: ChartWorkspace | Record<string, unknown>): void => {
      if (!widget) {
        return
      }
      const ws = normalizeWorkspace(raw)
      clearOverlays(widget, [...overlayIds])
      overlayIds.clear()
      clearIndicators(widget)
      setMainIndicators([])
      setSubIndicators({})

      if (ws.theme) {
        setTheme(ws.theme)
        widget.setStyles(ws.theme)
      }
      if (ws.styles) {
        setStyles(ws.styles)
        widget.setStyles(ws.styles)
      }
      if (ws.locale) {
        setLocale(ws.locale)
        widget.setLocale(ws.locale)
      }
      if (ws.timezone) {
        const item = toTimezoneItem(ws.timezone)
        setTimezone(item)
        widget.setTimezone(item.key)
      }
      if (typeof ws.drawingBarVisible === 'boolean') {
        setDrawingBarVisible(ws.drawingBarVisible)
      }
      if (ws.symbol && !symbolsEqual(ws.symbol, symbol())) {
        setSymbol(ws.symbol)
      }
      if (ws.period && !periodsEqual(ws.period, period())) {
        setPeriod(ws.period)
      }

      const { main, sub } = applyIndicators(widget, ws.indicators, (name, isStack, paneOptions) => {
        return createIndicator(widget, name, isStack, paneOptions)
      })
      setMainIndicators(main)
      setSubIndicators(sub)

      const ids = applyOverlays(widget, ws.overlays)
      ids.forEach(id => overlayIds.add(id))
      notifyWorkspaceChange()
    },
    subscribeWorkspaceChange: (callback: () => void): (() => void) => {
      workspaceListeners.add(callback)
      return () => { workspaceListeners.delete(callback) }
    },
    overrideIndicator: (override, paneId?: string): void => {
      if (!widget || !override?.name) {
        return
      }
      widget.overrideIndicator(override as any, paneId)
      notifyWorkspaceChange()
    },
    getIndicatorByPaneId: (paneId?: string, name?: string): unknown => {
      return widget?.getIndicatorByPaneId(paneId, name) ?? null
    },
    createOverlay: (overlay, paneId?: string): string | null => {
      if (!widget) {
        return null
      }
      return createOverlayTracked(overlay, paneId)
    },
    overrideOverlay: (override): void => {
      if (!widget || !override?.id) {
        return
      }
      widget.overrideOverlay(override as any)
      notifyWorkspaceChange()
    },
    removeOverlay: (id: string): void => {
      if (!widget || !id) {
        return
      }
      try {
        widget.removeOverlay(id)
      } catch {
        // ignore
      }
      overlayIds.delete(id)
      notifyWorkspaceChange()
    },
    getToolbarAccessoryContainer: (): HTMLElement | null => {
      return toolbarAccessoryEl
    },
    createIndicator: (name: string, isStack?: boolean, paneOptions?: { id?: string }): string | null => {
      if (!widget || !name) {
        return null
      }
      const paneId = createIndicator(widget, name, isStack, paneOptions as PaneOptions | undefined)
      if (!paneId) {
        return null
      }
      if (paneOptions?.id === 'candle_pane' || paneId === 'candle_pane') {
        const next = [...mainIndicators()]
        if (!next.includes(name)) {
          next.push(name)
          setMainIndicators(next)
        }
      } else {
        setSubIndicators({ ...subIndicators(), [name]: paneId })
      }
      notifyWorkspaceChange()
      return paneId
    }
  })

  const documentResize = () => {
    widget?.resize()
  }

  const adjustFromTo = (period: Period, toTimestamp: number, count: number) => {
    let to = toTimestamp
    let from = to
    switch (period.timespan) {
      case 'minute': {
        to = to - (to % (60 * 1000))
        from = to - count * period.multiplier * 60 * 1000
        break
      }
      case 'hour': {
        to = to - (to % (60 * 60 * 1000))
        from = to - count * period.multiplier * 60 * 60 * 1000
        break
      }
      case 'day': {
        to = to - (to % (60 * 60 * 1000))
        from = to - count * period.multiplier * 24 * 60 * 60 * 1000
        break
      }
      case 'week': {
        const date = new Date(to)
        const week = date.getDay()
        const dif = week === 0 ? 6 : week - 1
        to = to - dif * 60 * 60 * 24
        const newDate = new Date(to)
        to = new Date(`${newDate.getFullYear()}-${newDate.getMonth() + 1}-${newDate.getDate()}`).getTime()
        from = count * period.multiplier * 7 * 24 * 60 * 60 * 1000
        break
      }
      case 'month': {
        const date = new Date(to)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        to = new Date(`${year}-${month}-01`).getTime()
        from = count * period.multiplier * 30 * 24 * 60 * 60 * 1000
        const fromDate = new Date(from)
        from = new Date(`${fromDate.getFullYear()}-${fromDate.getMonth() + 1}-01`).getTime()
        break
      }
      case 'year': {
        const date = new Date(to)
        const year = date.getFullYear()
        to = new Date(`${year}-01-01`).getTime()
        from = count * period.multiplier * 365 * 24 * 60 * 60 * 1000
        const fromDate = new Date(from)
        from = new Date(`${fromDate.getFullYear()}-01-01`).getTime()
        break
      }
    }
    return [from, to]
  }

  onMount(() => {
    window.addEventListener('resize', documentResize)
    widget = init(widgetRef!, {
      customApi: {
        formatDate: (dateTimeFormat: Intl.DateTimeFormat, timestamp, format: string, type: FormatDateType) => {
          const p = period()
          switch (p.timespan) {
            case 'minute': {
              if (type === FormatDateType.XAxis) {
                return utils.formatDate(dateTimeFormat, timestamp, 'HH:mm')
              }
              return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD HH:mm')
            }
            case 'hour': {
              if (type === FormatDateType.XAxis) {
                return utils.formatDate(dateTimeFormat, timestamp, 'MM-DD HH:mm')
              }
              return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD HH:mm')
            }
            case 'day':
            case 'week': return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD')
            case 'month': {
              if (type === FormatDateType.XAxis) {
                return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM')
              }
              return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD')
            }
            case 'year': {
              if (type === FormatDateType.XAxis) {
                return utils.formatDate(dateTimeFormat, timestamp, 'YYYY')
              }
              return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD')
            }
          }
          return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD HH:mm')
        }
      }
    })

    if (widget) {
      const watermarkContainer = widget.getDom('candle_pane', DomPosition.Main)
      if (watermarkContainer) {
        let watermark = document.createElement('div')
        watermark.className = 'klinecharts-pro-watermark'
        if (utils.isString(props.watermark)) {
          const str = (props.watermark as string).replace(/(^\s*)|(\s*$)/g, '')
          watermark.innerHTML = str
        } else {
          watermark.appendChild(props.watermark as Node)
        }
        watermarkContainer.appendChild(watermark)
      }

      const priceUnitContainer = widget.getDom('candle_pane', DomPosition.YAxis)
      priceUnitDom = document.createElement('span')
      priceUnitDom.className = 'klinecharts-pro-price-unit'
      priceUnitContainer?.appendChild(priceUnitDom)
    }

    mainIndicators().forEach(indicator => {
      createIndicator(widget, indicator, true, { id: 'candle_pane' })
    })
    const subIndicatorMap = {}
    props.subIndicators!.forEach(indicator => {
      const paneId = createIndicator(widget, indicator, true)
      if (paneId) {
        // @ts-expect-error
        subIndicatorMap[indicator] = paneId
      }
    })
    setSubIndicators(subIndicatorMap)
    widget?.loadMore(timestamp => {
      const token = reloadGate.beginLoadMore()
      const get = async () => {
        const p = period()
        const s = symbol()
        const [to] = adjustFromTo(p, timestamp!, 1)
        const [from] = adjustFromTo(p, to, 500)
        const kLineDataList = await props.datafeed.getHistoryKLineData(s, p, from, to)
        if (!reloadGate.isLoadMoreCurrent(token)) {
          return
        }
        widget?.applyMoreData(kLineDataList, kLineDataList.length > 0)
      }
      get()
    })
    widget?.subscribeAction(ActionType.OnTooltipIconClick, (data) => {
      if (data.indicatorName) {
        switch (data.iconId) {
          case 'visible': {
            widget?.overrideIndicator({ name: data.indicatorName, visible: true }, data.paneId)
            break
          }
          case 'invisible': {
            widget?.overrideIndicator({ name: data.indicatorName, visible: false }, data.paneId)
            break
          }
          case 'setting': {
            const indicator = widget?.getIndicatorByPaneId(data.paneId, data.indicatorName) as Indicator
            setIndicatorSettingModalParams({
              visible: true, indicatorName: data.indicatorName, paneId: data.paneId, calcParams: indicator.calcParams
            })
            break
          }
          case 'close': {
            if (data.paneId === 'candle_pane') {
              const newMainIndicators = [...mainIndicators()]
              widget?.removeIndicator('candle_pane', data.indicatorName)
              newMainIndicators.splice(newMainIndicators.indexOf(data.indicatorName), 1)
              setMainIndicators(newMainIndicators)
            } else {
              const newIndicators = { ...subIndicators() }
              widget?.removeIndicator(data.paneId, data.indicatorName)
              // @ts-expect-error
              delete newIndicators[data.indicatorName]
              setSubIndicators(newIndicators)
            }
            notifyWorkspaceChange()
          }
        }
      }
    })
  })

  onCleanup(() => {
    window.removeEventListener('resize', documentResize)
    dispose(widgetRef!)
  })

  createEffect(() => {
    const s = symbol()
    if (s?.priceCurrency) {
      priceUnitDom.innerHTML = s?.priceCurrency.toLocaleUpperCase()
      priceUnitDom.style.display = 'flex'
    } else {
      priceUnitDom.style.display = 'none'
    }
    widget?.setPriceVolumePrecision(s?.pricePrecision ?? 2, s?.volumePrecision ?? 0)
  })

  createEffect((prev?: PrevSymbolPeriod) => {
    const s = symbol()
    const p = period()
    const gen = reloadGate.beginHistory()
    if (prev) {
      try {
        props.datafeed.unsubscribe(prev.symbol, prev.period)
      } catch {
        // ignore
      }
    }
    setLoadingVisible(true)
    const get = async () => {
      try {
        const [from, to] = adjustFromTo(p, new Date().getTime(), 500)
        const kLineDataList = await props.datafeed.getHistoryKLineData(s, p, from, to)
        if (!reloadGate.isHistoryCurrent(gen)) {
          return
        }
        widget?.applyNewData(kLineDataList, kLineDataList.length > 0)
        props.datafeed.subscribe(s, p, data => {
          if (reloadGate.isHistoryCurrent(gen)) {
            widget?.updateData(data)
          }
        })
      } finally {
        if (reloadGate.isHistoryCurrent(gen)) {
          setLoadingVisible(false)
        }
      }
    }
    get()
    return { symbol: s, period: p }
  })

  createEffect(() => {
    const t = theme()
    widget?.setStyles(t)
    const color = t === 'dark' ? '#929AA5' : '#76808F'
    widget?.setStyles({
      indicator: {
        tooltip: {
          icons: [
            {
              id: 'visible',
              position: TooltipIconPosition.Middle,
              marginLeft: 8,
              marginTop: 7,
              marginRight: 0,
              marginBottom: 0,
              paddingLeft: 0,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              icon: '\ue903',
              fontFamily: 'icomoon',
              size: 14,
              color: color,
              activeColor: color,
              backgroundColor: 'transparent',
              activeBackgroundColor: 'rgba(22, 119, 255, 0.15)'
            },
            {
              id: 'invisible',
              position: TooltipIconPosition.Middle,
              marginLeft: 8,
              marginTop: 7,
              marginRight: 0,
              marginBottom: 0,
              paddingLeft: 0,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              icon: '\ue901',
              fontFamily: 'icomoon',
              size: 14,
              color: color,
              activeColor: color,
              backgroundColor: 'transparent',
              activeBackgroundColor: 'rgba(22, 119, 255, 0.15)'
            },
            {
              id: 'setting',
              position: TooltipIconPosition.Middle,
              marginLeft: 6,
              marginTop: 7,
              marginBottom: 0,
              marginRight: 0,
              paddingLeft: 0,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              icon: '\ue902',
              fontFamily: 'icomoon',
              size: 14,
              color: color,
              activeColor: color,
              backgroundColor: 'transparent',
              activeBackgroundColor: 'rgba(22, 119, 255, 0.15)'
            },
            {
              id: 'close',
              position: TooltipIconPosition.Middle,
              marginLeft: 6,
              marginTop: 7,
              marginRight: 0,
              marginBottom: 0,
              paddingLeft: 0,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              icon: '\ue900',
              fontFamily: 'icomoon',
              size: 14,
              color: color,
              activeColor: color,
              backgroundColor: 'transparent',
              activeBackgroundColor: 'rgba(22, 119, 255, 0.15)'
            }
          ]
        }
      }
    })
  })

  createEffect(() => {
    widget?.setLocale(locale())
  })

  createEffect(() => {
    widget?.setTimezone(timezone().key)
  })

  createEffect(() => {
    if (styles()) {
      widget?.setStyles(styles())
      setWidgetDefaultStyles(lodashClone(widget!.getStyles()))
    }
  })

  return (
    <>
      <i class="icon-close klinecharts-pro-load-icon"/>
      <Show when={symbolSearchModalVisible()}>
        <SymbolSearchModal
          locale={props.locale}
          datafeed={props.datafeed}
          onSymbolSelected={symbol => { setSymbol(symbol) }}
          onClose={() => { setSymbolSearchModalVisible(false) }}/>
      </Show>
      <Show when={indicatorModalVisible()}>
        <IndicatorModal
          locale={props.locale}
          mainIndicators={mainIndicators()}
          subIndicators={subIndicators()}
          onClose={() => { setIndicatorModalVisible(false) }}
          onMainIndicatorChange={data => {
            const newMainIndicators = [...mainIndicators()]
            if (data.added) {
              createIndicator(widget, data.name, true, { id: 'candle_pane' })
              newMainIndicators.push(data.name)
            } else {
              widget?.removeIndicator('candle_pane', data.name)
              newMainIndicators.splice(newMainIndicators.indexOf(data.name), 1)
            }
            setMainIndicators(newMainIndicators)
            notifyWorkspaceChange()
          }}
          onSubIndicatorChange={data => {
            const newSubIndicators = { ...subIndicators() }
            if (data.added) {
              const paneId = createIndicator(widget, data.name)
              if (paneId) {
                // @ts-expect-error
                newSubIndicators[data.name] = paneId
              }
            } else {
              if (data.paneId) {
                widget?.removeIndicator(data.paneId, data.name)
                // @ts-expect-error
                delete newSubIndicators[data.name]
              }
            }
            setSubIndicators(newSubIndicators)
            notifyWorkspaceChange()
          }}/>
      </Show>
      <Show when={timezoneModalVisible()}>
        <TimezoneModal
          locale={props.locale}
          timezone={timezone()}
          timezoneOptions={resolveTimezoneSelectOptions(props.locale, {
            curated: props.timezoneCurated === true,
            timezoneSelectOptions: props.timezoneSelectOptions
          })}
          onClose={() => { setTimezoneModalVisible(false) }}
          onConfirm={(tz) => {
            setTimezone(toTimezoneItem(tz.key))
            notifyWorkspaceChange()
          }}
        />
      </Show>
      <Show when={settingModalVisible()}>
        <SettingModal
          locale={props.locale}
          currentStyles={utils.clone(widget!.getStyles())}
          onClose={() => { setSettingModalVisible(false) }}
          onChange={style => {
            widget?.setStyles(style)
            notifyWorkspaceChange()
          }}
          onRestoreDefault={(options: SelectDataSourceItem[]) => {
            const style = {}
            options.forEach(option => {
              const key = option.key
              lodashSet(style, key, utils.formatValue(widgetDefaultStyles(), key))
            })
            widget?.setStyles(style)
            notifyWorkspaceChange()
          }}
        />
      </Show>
      <Show when={screenshotUrl().length > 0}>
        <ScreenshotModal
          locale={props.locale}
          url={screenshotUrl()}
          onClose={() => { setScreenshotUrl('') }}
        />
      </Show>
      <Show when={indicatorSettingModalParams().visible}>
        <IndicatorSettingModal
          locale={props.locale}
          params={indicatorSettingModalParams()}
          onClose={() => { setIndicatorSettingModalParams({ visible: false, indicatorName: '', paneId: '', calcParams: [] }) }}
          onConfirm={(params)=> {
            const modalParams = indicatorSettingModalParams()
            widget?.overrideIndicator({ name: modalParams.indicatorName, calcParams: params }, modalParams.paneId)
            notifyWorkspaceChange()
          }}
        />
      </Show>
      <PeriodBar
        locale={props.locale}
        symbol={symbol()}
        spread={drawingBarVisible()}
        period={period()}
        periods={props.periods}
        periodBar={props.periodBar}
        onMenuClick={async () => {
          try {
            await startTransition(() => setDrawingBarVisible(!drawingBarVisible()))
            widget?.resize()
          } catch (e) {}    
        }}
        onSymbolClick={() => { setSymbolSearchModalVisible(!symbolSearchModalVisible()) }}
        onPeriodChange={setPeriod}
        onIndicatorClick={() => { setIndicatorModalVisible((visible => !visible)) }}
        onTimezoneClick={() => { setTimezoneModalVisible((visible => !visible)) }}
        onSettingClick={() => { setSettingModalVisible((visible => !visible)) }}
        onScreenshotClick={() => {
          if (widget) {
            const url = widget.getConvertPictureUrl(true, 'jpeg', props.theme === 'dark' ? '#151517' : '#ffffff')
            setScreenshotUrl(url)
          }
        }}
        onAccessoryRef={(el) => { toolbarAccessoryEl = el }}
      />
      <div
        class="klinecharts-pro-content">
        <Show when={loadingVisible()}>
          <Loading/>
        </Show>
        <Show when={drawingBarVisible()}>
          <DrawingBar
            locale={props.locale}
            onDrawingItemClick={overlay => { createOverlayTracked(overlay) }}
            onModeChange={mode => { widget?.overrideOverlay({ mode: mode as OverlayMode }); notifyWorkspaceChange() }}
            onLockChange={lock => { widget?.overrideOverlay({ lock }); notifyWorkspaceChange() }}
            onVisibleChange={visible => { widget?.overrideOverlay({ visible }); notifyWorkspaceChange() }}
            onRemoveClick={(groupId) => { widget?.removeOverlay({ groupId }); notifyWorkspaceChange() }}/>
        </Show>
        <div
          ref={widgetRef}
          class='klinecharts-pro-widget'
          data-drawing-bar-visible={drawingBarVisible()}/>
      </div>
    </>
  )
}

export default ChartProComponent