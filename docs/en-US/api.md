# API

## Creating chart
```typescript
new KLineChartPro(
  options: {
    container: string | HTMLElement;
    styles?: DeepPartial<Styles>;
    watermark?: string | Node;
    theme?: string;
    locale?: string;
    drawingBarVisible?: boolean;
    symbol: SymbolInfo;
    period: Period;
    periods?: Period[];
    timezone?: string;
    mainIndicators?: string[];
    subIndicators?: string[];
    datafeed: Datafeed;
  }
) => KLineChartPro
```
+ `container` Container id or container
+ `styles` Core chart styles
+ `watermark` Watermark
+ `theme` Theme
+ `locale` Language
+ `drawingBarVisible` Whether to display the drawing toolbar
+ `symbol` Symbol
+ `period` Period
+ `periods` All periods
+ `timezone` Timezone
+ `mainIndicators` Main indicators
+ `subIndicators` Sub indicators
+ `datafeed` Data access API implementation
+ `periodBar` Toolbar chrome (`showPeriods`, `showScreenshot`, `showFullscreen`, `toolsIconOnly`, `showToolbarAccessory`, `showPeriodLabel`). Candlex: no TF chips, period label on, no screenshot/fullscreen, icon-only tools, trailing accessory on.
+ `timezoneCurated` When `true`, timezone modal only lists UTC / New York / Madrid; omitted or out-of-list TZ falls back to `Etc/UTC`.
+ `timezoneSelectOptions` Optional full override of timezone modal options (wins over `timezoneCurated`).

## Chart API
### setTheme(theme)
```typescript
(theme: string) => void
```
Set theme.

### getTheme()
```typescript
() => string
```
Get theme.

### setStyles(styles)
```typescript
(styles: DeepPartial<Styles>) => void
```
Set core chart styles.

### getStyles()
```typescript
() => Styles
```
Get core chart styles.

### setLocale(locale)
```typescript
(locale: string) => void
```
Set language.

### getLocale()
```typescript
() => string
```
Get language.

### setTimezone(timezone)
```typescript
(timezone: string) => void
```
Set timezone.

### getTimezone()
```typescript
() => string
```
Get timezone.

### setSymbol(symbol)
```typescript
(symbol: SymbolInfo) => void
```
Set symbol

### getSymbol()
```typescript
() => SymbolInfo
```
Get symbol.

### setPeriod(period)
```typescript
(period: Period) => void
```
Set period.

### getPeriod()
```typescript
() => Period
```
Get period.

### exportWorkspace()
```typescript
() => ChartWorkspace
```
Export indicators (including per-instance `styles`), overlays, and chart settings. Does not include OHLC.

### importWorkspace(workspace)
```typescript
(workspace: ChartWorkspace | Record<string, unknown>) => void
```
Restore a workspace JSON (`schemaVersion` = `1`; `WorkspaceIndicator.styles` is additive/optional).

### subscribeWorkspaceChange(callback)
```typescript
(callback: () => void) => () => void
```
Subscribe to indicator/overlay/settings mutations (host auto-save). Returns unsubscribe.

### overrideIndicator(override, paneId?)
```typescript
(
  override: {
    name: string
    calcParams?: unknown[]
    visible?: boolean
    styles?: DeepPartial<IndicatorStyle>
  },
  paneId?: string
) => void
```
Override a live indicator instance. MA: `styles.lines[0..4]` with `color` + `size`. BOLL: `styles.lines[0]=UP`, `[1]=MID`, `[2]=DN`.

### getIndicatorByPaneId(paneId?, name?)
```typescript
(paneId?: string, name?: string) => unknown
```
Read indicator(s) from the underlying chart.

### createOverlay(overlay, paneId?)
```typescript
(overlay: OverlayCreateInput | string, paneId?: string) => string | null
```
Create an overlay and track its id for workspace export. For previous-day H/L/C rays use `name: 'horizontalRayLine'` with two points at the same `value`.

### overrideOverlay(override)
```typescript
(override: { id: string } & Record<string, unknown>) => void
```
Update an existing overlay by id (points, styles, extendData, …).

### removeOverlay(id)
```typescript
(id: string) => void
```
Remove an overlay by id and drop it from workspace tracking.

### getToolbarAccessoryContainer()
```typescript
() => HTMLElement | null
```
Trailing period-bar mount for host DOM (countdown). Returns `null` if the accessory slot is disabled.

### createIndicator(name, isStack?, paneOptions?)
```typescript
(name: string, isStack?: boolean, paneOptions?: { id?: string }) => string | null
```
Create an indicator with Pro tooltip icons. Returns pane id.
