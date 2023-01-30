import {
    ActiveSymbols,
    TicksStreamResponse,
    TradingTimesResponse,
    AuditDetailsForExpiredContract,
    ProposalOpenContract,
} from '@deriv/api-types';
import { HtmlHTMLAttributes } from 'react';
import { BinaryAPI } from 'src/binaryapi';
import { ChartTypes } from 'src/Constant';
import ChartState from 'src/store/ChartState';
import { TNotification } from 'src/store/Notifier';
import { TGranularity } from '.';
import { OHLCStreamResponse } from './api.types';

declare global {
    interface Window {
        flutterChart: TFlutterChart;
        flutterChartElement: HTMLElement;
        _flutter: {
            loader: {
                didCreateEngineInitializer: (engineInitializer: TEngineInitializer) => void;
            };
        };
        jsInterop: JSInterop;
    }
}

export type TAppRunner = {
    runApp: () => void;
};

export type TEngineInitializer = {
    initializeEngine: ({ hostElement }: { hostElement: HTMLElement }) => Promise<TAppRunner>;
};

export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
    ? ElementType
    : never;

export type TObject = {
    [key: string]: unknown;
};

export type TCustomEvent = React.MouseEvent<HTMLElement> & {
    isHandledByDialog: boolean;
    nativeEvent: {
        isHandledByDialog: boolean;
        is_item_removed: boolean;
    };
};

export type TBinaryAPIRequest = {
    passthrough?: {
        [k: string]: unknown;
    };
    req_id?: number;
    [key: string]: unknown;
};

export type TBinaryAPIResponse = {
    echo_req: {
        [k: string]: unknown;
    };
    req_id?: number;
    msg_type: any;
    [key: string]: unknown;
};

export type TRequestAPI = (request: TBinaryAPIRequest) => Promise<TBinaryAPIResponse>;
export type TResponseAPICallback = (response: TBinaryAPIResponse) => void;
export type TRequestSubscribe = (request: TBinaryAPIRequest, callback: TResponseAPICallback) => void;
export type TRequestForgetStream = (id: string) => void;
export type TRequestForget = (request: TBinaryAPIRequest, callback: TResponseAPICallback) => void;
export type TNetworkConfig = {
    class: string;
    tooltip: string;
};

export type Listener = (...args: any[]) => void;

export type TIconProps = {
    className?: string;
    ['tooltip-title']?: React.ReactElement | string;
} & HtmlHTMLAttributes<HTMLSpanElement>;

export type TBar = {
    height: number;
    cName: string;
};

export type ChartType = ArrayElement<typeof ChartTypes> & { active?: boolean; disabled?: boolean };

export type TLanguage = {
    key: string;
    name: string;
    icon: JSX.Element;
};

export type TSettings = {
    countdown?: boolean;
    historical?: boolean;
    lang?: string;
    language?: string;
    position?: string;
    enabledNavigationWidget?: boolean;
    isAutoScale?: boolean;
    isHighestLowestMarkerEnabled?: boolean;
    theme?: string;
    activeLanguages?: Array<string | TLanguage> | null;
};

export type TStateChangeListener = (state: string, option?: { symbol: string | undefined; isClosed: boolean }) => void;

export type TRatio = {
    height: number;
    percent: number;
};

export type TGetIndicatorHeightRatio = (chart_height: number, indicator_count: number) => TRatio;

export type TInitialChartData = {
    masterData?: TQuote[];
    tradingTimes?: TradingTimesResponse['trading_times'];
    activeSymbols?: ActiveSymbols;
};

export type TBarrierUpdateProps = {
    shade: string;
    shadeColor: string | undefined;
    foregroundColor: string | null;
    color: string;
    onChange: (param: TBarrierChangeParam) => void;
    relative: boolean;
    draggable: boolean;
    lineStyle: string;
    hidePriceLines: boolean;
    high?: number;
    low?: number;
    hideBarrierLine?: boolean;
    hideOffscreenBarrier?: boolean;
    hideOffscreenLine?: boolean;
    title?: string;
    showOffscreenArrows?: boolean;
    isSingleBarrier?: boolean;
    opacityOnOverlap?: number;
    key: string;
};

export type TChartProps = {
    requestAPI: BinaryAPI['requestAPI'];
    requestSubscribe: BinaryAPI['requestSubscribe'];
    requestForget: BinaryAPI['requestForget'];
    requestForgetStream?: BinaryAPI['requestForgetStream'];
    id?: string;
    getMarketsOrder?: (active_symbols: ActiveSymbols) => string[];
    getIndicatorHeightRatio?: TGetIndicatorHeightRatio;
    symbol?: string;
    feedCall?: { activeSymbols?: boolean; tradingTimes?: boolean };
    granularity?: TGranularity;
    chartType?: string;
    startEpoch?: number;
    endEpoch?: number;
    chartControlsWidgets?: TChartControlsWidgets;
    topWidgets?: () => React.ReactElement;
    bottomWidgets?: () => React.ReactElement;
    toolbarWidget?: () => React.ReactElement;
    isMobile?: boolean;
    onSettingsChange?: (newSettings: Omit<TSettings, 'activeLanguages'>) => void;
    stateChangeListener?: TStateChangeListener;
    settings?: TSettings;
    barriers?: TBarrierUpdateProps[];
    enableRouting?: boolean;
    enable?: boolean;
    isConnectionOpened?: boolean;
    onMessage?: (message: TNotification) => void;
    isAnimationEnabled?: boolean;
    showLastDigitStats?: boolean;
    scrollToEpoch?: number | null;
    clearChart?: () => void;
    shouldFetchTradingTimes?: boolean;
    shouldFetchTickHistory?: boolean;
    allTicks?: keyof AuditDetailsForExpiredContract | [];
    contractInfo?: keyof ProposalOpenContract | {};
    maxTick?: number | null;
    crosshairTooltipLeftAllow?: number | null;
    zoom?: number;
    yAxisMargin?: { bottom: number; top: number };
    enableScroll?: boolean | null;
    enableZoom?: boolean | null;
    initialData?: TInitialChartData;
    chartData?: TInitialChartData;
    networkStatus?: TNetworkConfig;
    refreshActiveSymbols?: ChartState['refreshActiveSymbols'];
    chartStatusListener?: ChartState['chartStatusListener'];
    enabledChartFooter?: boolean;
    anchorChartToLeft?: boolean;
    margin?: number;
    isStaticChart?: ChartState['isStaticChart'];
    enabledNavigationWidget?: boolean;
    onCrosshairChange?: (state?: number) => void;
    onGranularityChange?: (granularity?: TGranularity) => void;
    onChartTypeChange?: (chartType?: string) => void;
    crosshairState?: number | null;
    children?: React.ReactNode;
    historical?: boolean;
    markers_array: any[];
    isLive?: boolean;
    dataFitEnabled?: boolean;
};

export type TQuote = {
    Date: string;
    Open?: number;
    High?: number;
    Low?: number;
    Close: number;
    tick?: TicksStreamResponse['tick'];
    ohlc?: OHLCStreamResponse['ohlc'];
    DT?: Date;
    prevClose?: number;
    Volume?: number;
};

export interface IPendingPromise<T, E> extends Promise<T> {
    resolve: (res: T | PromiseLike<T>) => void;
    reject: (error: E | PromiseLike<E>) => void;
    isPending: boolean;
    data: any;
}

export type TChanges = {
    [key: string]: boolean;
};

export type TSettingsItemGroup = {
    key: string;
    fields: TSettingsParameter[];
};

export type TOpenClose = { date: string; open: Date; close: Date };
export type TTimes = { open: Date; close: Date };

export type TTradingTimesItem = {
    feed_license?: string;
    isClosedToday: boolean;
    holidays: string[];
    closes_early: TOpenClose[];
    opens_late: TOpenClose[];
    delay_amount: number;
    times?: TTimes[];
    isOpenAllDay: boolean;
    isClosedAllDay: boolean;
    isOpened?: boolean;
};

export type TBarrierChangeParam = { high?: number; low?: number };

export type TOpenMarket = {
    category?: string;
    subcategory?: string | null;
    market?: string | null;
};

export type TRefData = {
    setPosition: ({ epoch, price }: Record<string, number | null | undefined>) => void;
    div: HTMLDivElement;
    value?: Element | null;
};

export type TChartControlsWidgets = ((props: { isMobile?: boolean }) => React.ReactElement) | null;

export type TIcon = (props: TIconProps) => JSX.Element;

export type TMessage = {
    type: string;
    payload: any;
};

export type TPaginationCallbackParams = { quotes?: TQuote[]; error?: unknown; moreAvailable?: boolean };
export type TPaginationCallback = (params: TPaginationCallbackParams) => void;

export type TIndicatorConfig = {
    id: string;
    name: string;
};

export type TIndicatorsTree = {
    icon: TIcon;
    name: string;
    category: string;
    items: TIndicatorItem[];
    foundItems?: TActiveItem[];
};

export type TIndicatorItem = {
    description: string;
    icon: TIcon;
    isPrediction?: boolean;
    name: string;
    title: string;
};

export type TActiveItem = TIndicatorItem & {
    id: string;
    config?: Record<string, any>;
    parameters: TSettingsParameter[];
    bars?: string;
};

export type TNewChartPayload = {
    granularity: number;
    isLive: boolean;
    dataFitEnabled: boolean;
    chartType?: string;
    theme: string;
};

export type TFlutterChart = {
    config: {
        updateTheme: (theme: string) => void;
        addOrUpdateIndicator: (config: string) => void;
        removeIndicator: (id: string) => void;
        newChart: (payload: TNewChartPayload) => void;
        scale: (scale: number) => void;
        updateChartStyle: (chartStyle: string) => void;
        updateLiveStatus: (isLive: string) => void;
        updateMarkers: (markers: any[]) => void;
        updateCrosshairVisibility: (visibility: boolean) => void;
    };
    controller: {
        getXFromEpoch: (epoch: number) => number;
        getYFromQuote: (quote: number) => number;
        getEpochFromX: (x: number) => number;
        getQuoteFromY: (y: number) => number;
    };
    dataModel: {
        onTickHistory: (quotes: TQuote[], append: boolean) => void;
        onNewTick: (quote: TQuote) => void;
        onNewCandle: (quote: TQuote) => void;
    };
};

export type JSInterop = {
    onChartLoad: () => void;
    onVisibleAreaChanged: (leftEpoch: number, rightEpoch: number) => void;
    onQuoteAreaChanged: (topQuote: number, bottomQuote: number) => void;
    onCrosshairDisappeared: () => void;
    onCrosshairHover: (dx: number, dy: number, epoch: number, quote: String) => void;
    loadHistory: (request: TLoadHistoryParams) => void;
    indicators: {
        onRemove: (id: string) => void;
        onEdit: (id: string) => void;
    };
};

export type TLoadHistoryParams = {
    count: number;
    end: number;
};

export type TDragEvents = {
    onDragStart?: (ev: MouseEvent) => void;
    onDrag?: (ev: MouseEvent) => void;
    onDragReleased?: (ev: MouseEvent) => void;
};

export type TLayout = {
    chartType?: string;
    timeUnit?: string | number;
    granularity?: TGranularity;
    studyItems?: TActiveItem[];
    crosshair: number | null;
};

export type TAllTicks = Exclude<AuditDetailsForExpiredContract, null>['all_ticks'];

export type TSettingsParameterType =
    | 'colorpicker'
    | 'number'
    | 'select'
    | 'numbercolorpicker'
    | 'switch'
    | 'pattern'
    | 'numericinput'
    | 'font';
export type TIndicatorCategory = 'inputs' | 'outputs' | 'parameters';

export interface BaseIndicatorParameter {
    path?: string;
    paths?: {
        [x: string]: string;
    };
    type: TSettingsParameterType;
    title: string;
    subtitle?: string;
    category: TIndicatorCategory;
}

export interface IndicatorParameter<T> extends BaseIndicatorParameter {
    value?: T;
    defaultValue: T;
}

export interface TColorPickerParameter extends IndicatorParameter<string> {
    type: 'colorpicker';
}

export interface TNumberParameter extends IndicatorParameter<number> {
    type: 'number';
    min?: number;
    max?: number;
    step?: number;
}

export interface TSelectParameter extends IndicatorParameter<string> {
    type: 'select';
    options: Record<string, string>;
}

export type TNumberPickerValue = {
    color: string;
    value: number;
};

export interface TNumberColorPickerParameter extends IndicatorParameter<TNumberPickerValue> {
    type: 'numbercolorpicker';
}

export interface TSwitchParameter extends IndicatorParameter<boolean> {
    type: 'switch';
}

export interface TPatternParameter extends IndicatorParameter<string> {
    type: 'pattern';
}

export interface TFontParameter extends IndicatorParameter<Record<string, string | undefined>> {
    type: 'font';
}

export interface TNumericInputParameter extends IndicatorParameter<number> {
    type: 'numericinput';
    min?: number;
    max?: number;
    step?: number;
}

export type TSettingsParameter =
    | TColorPickerParameter
    | TNumberParameter
    | TSelectParameter
    | TNumberColorPickerParameter
    | TSwitchParameter
    | TPatternParameter
    | TFontParameter
    | TNumericInputParameter;

export type TDefaultIndicatorConfig = {
    config?: Record<string, any>;
    parameters: TSettingsParameter[];
};

export type TDefaultIndicatorConfigs = Record<string, TDefaultIndicatorConfig>;
