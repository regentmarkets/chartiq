import {
    ChartMode,
    ChartSetting,
    ChartTitle,
    createObjectFromLocalStorage,
    DrawTools,
    LogActions,
    LogCategories,
    logEvent,
    Marker,
    setSmartChartsPublicPath,
    Share,
    SmartChart,
    StudyLegend,
    ToolbarWidget,
    Views,
} from '@deriv-com/smartcharts'; // eslint-disable-line import/no-unresolved
import whyDidYouRender from '@welldone-software/why-did-you-render';
import { configure } from 'mobx';
import moment from 'moment';
import React from 'react';
import ReactDOM from 'react-dom';
import { TNotification } from 'src/store/Notifier';
import { TGranularity, TNetworkConfig, TRefData, TStateChangeListener } from 'src/types';
import { AuditDetailsForExpiredContract, ProposalOpenContract } from '@deriv/api-types';
import 'url-search-params-polyfill';
import './app.scss';
import ChartHistory from './ChartHistory';
import ChartNotifier from './ChartNotifier';
import { ConnectionManager, StreamManager } from './connection';
import NetworkMonitor from './connection/NetworkMonitor';
import Notification from './Notification';

setSmartChartsPublicPath('./dist/');
const isMobile = window.navigator.userAgent.toLowerCase().includes('mobi');
if (process.env.NODE_ENV !== 'production') {
    whyDidYouRender(React, {
        collapseGroups: true,
        include: [/.*/],
        exclude: [/^RenderInsideChart$/, /^inject-/],
    });
}

const trackJSDomains = ['binary.com', 'binary.me', 'deriv.com'];
window.isProductionWebsite = trackJSDomains.some(val => window.location.host.endsWith(val));

if (window.isProductionWebsite) {
    window._trackJs = { token: '346262e7ffef497d85874322fff3bbf8', application: 'smartcharts' };
    const s = document.createElement('script');
    s.src = 'https://cdn.trackjs.com/releases/current/tracker.js';
    document.body.appendChild(s);
}

/* // PWA support is temporarily removed until its issues can be sorted out
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(`${window.location.origin + window.location.pathname}sw.js`)
        .then(() => {
            console.log('Service Worker Registered');
        }).catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
        });
}
*/
configure({ enforceActions: 'observed' });
function getLanguageStorage() {
    const default_language = 'en';
    try {
        const setting_string = localStorage.getItem('smartchart-setting') || '',
            setting = JSON.parse(setting_string !== '' ? setting_string : '{}');
        return setting.language || default_language;
    } catch (e) {
        return default_language;
    }
}
function getServerUrl() {
    const local = localStorage.getItem('config.server_url');
    return `wss://${local || 'red.derivws.com'}/websockets/v3`;
}
const chartId = '1';
const appId = localStorage.getItem('config.app_id') || 12812;
const serverUrl = getServerUrl();
const language = new URLSearchParams(window.location.search).get('l') || getLanguageStorage();
const today = moment().format('YYYY/MM/DD 00:00');
const connectionManager = new ConnectionManager({
    appId,
    language,
    endpoint: serverUrl,
});
const IntervalEnum = {
    second: 1,
    minute: 60,
    hour: 3600,
    day: 24 * 3600,
    year: 365 * 24 * 3600,
};
const activeLanguages = [
    'EN',
    'BN',
    'DE',
    'AR',
    'ES',
    'FR',
    'ID',
    'IT',
    'KM',
    'KO',
    'MN',
    'PL',
    'PT',
    'RU',
    'SI',
    'SW',
    'TR',
    'TH',
    'UZ',
    'VI',
    'ZH_CN',
    'ZH_TW',
];
const streamManager = new StreamManager(connectionManager);
const requestAPI = connectionManager.send.bind(connectionManager);
const requestSubscribe = streamManager.subscribe.bind(streamManager);
const requestForget = streamManager.forget.bind(streamManager);
const App = () => {
    const startingLanguageRef = React.useRef('en');

    const [notifier] = React.useState(new ChartNotifier());
    const [layoutString] = React.useState(localStorage.getItem(`layout-${chartId}`) || '');
    const [layout] = React.useState(JSON.parse(layoutString !== '' ? layoutString : '{}'));
    const initialSettings = React.useMemo(() => {
        let _settings = createObjectFromLocalStorage('smartchart-setting');
        if (_settings) {
            _settings.language = language;
            startingLanguageRef.current = _settings.language;
        } else {
            _settings = { language };
        }
        _settings.activeLanguages = activeLanguages;
        if (_settings.historical) {
            _settings.isHighestLowestMarkerEnabled = false;
        }
        return _settings;
    }, []);

    const [settings, setSettings] = React.useState(initialSettings);
    const settingsRef = React.useRef<typeof settings>();
    settingsRef.current = settings;

    const memoizedValues = React.useMemo(() => {
        let endEpoch: number | undefined,
            granularity: number | undefined,
            chartType = '',
            symbol = '';
        if (settingsRef.current.historical) {
            endEpoch = new Date(`${today}:00Z`).valueOf() / 1000;
            chartType = 'line';
            granularity = 0;
            if (layout) {
                granularity =
                    layout.timeUnit === 'second'
                        ? 0
                        : parseInt(
                              (layout.interval * IntervalEnum[layout.timeUnit as keyof typeof IntervalEnum]).toString(),
                              10
                          ); // eslint-disable-line
                if (layout.chartType === 'candles' && layout.aggregationType !== 'ohlc') {
                    chartType = layout.aggregationType;
                } else {
                    chartType = layout.chartType;
                }
                symbol = layout.symbol;
            }
        }
        return {
            chartType,
            granularity,
            endEpoch,
            symbol,
        };
    }, [layout]);
    const [chartType, setChartType] = React.useState<string | undefined>(memoizedValues.chartType);
    const [granularity, setGranularity] = React.useState<TGranularity>(memoizedValues.granularity as TGranularity);
    const [endEpoch, setEndEpoch] = React.useState(memoizedValues.endEpoch);
    const [isConnectionOpened, setIsConnectionOpened] = React.useState(true);
    const [networkStatus, setNetworkStatus] = React.useState<TNetworkConfig>();
    const [symbol, setSymbol] = React.useState<string>(memoizedValues.symbol);
    const allTicks: keyof AuditDetailsForExpiredContract | [] = [];
    const contractInfo: keyof ProposalOpenContract | {} = {};
    React.useEffect(() => {
        connectionManager.on(ConnectionManager.EVENT_CONNECTION_CLOSE, () => setIsConnectionOpened(false));
        connectionManager.on(ConnectionManager.EVENT_CONNECTION_REOPEN, () => setIsConnectionOpened(true));
        const networkMonitor = NetworkMonitor.getInstance();
        networkMonitor.init(requestAPI, handleNetworkStatus);
    }, []);
    /*
    shouldComponentUpdate(nextProps, nextState) {
        return this.state.symbol !== nextState.symbol
            || JSON.stringify(this.state.settings) !== JSON.stringify(nextState.settings);
    }
    */
    const handleNetworkStatus = (status: TNetworkConfig) => setNetworkStatus(status);
    const saveSettings = React.useCallback(newSettings => {
        const prevSetting = settingsRef.current;
        console.log('settings updated:', newSettings);
        localStorage.setItem('smartchart-setting', JSON.stringify(newSettings));
        if (!prevSetting.historical && newSettings.historical) {
            setChartType('line');
            setGranularity(0);
            setEndEpoch(new Date(`${today}:00Z`).valueOf() / 1000);
        } else if (!newSettings.historical) {
            handleDateChange('');
        }
        setSettings(newSettings);
        if (startingLanguageRef.current !== newSettings.language) {
            // Place language in URL:
            const { origin, search, pathname } = window.location;
            const url = new URLSearchParams(search);
            url.delete('l');
            url.set('l', newSettings.language);
            window.location.href = `${origin}${pathname}?${url.toString()}`;
        }
    }, []);
    const handleDateChange = (value: string) => {
        setEndEpoch(value !== '' ? new Date(`${value}:00Z`).valueOf() / 1000 : undefined);
    };
    const handleStateChange: TStateChangeListener = (tag, option) =>
        console.log(`chart state changed to ${tag} with the option of ${option ? JSON.stringify(option) : '{}'}`);
    const renderTopWidgets = React.useCallback(() => {
        const symbolChange = (new_symbol: string) => {
            logEvent(LogCategories.ChartTitle, LogActions.MarketSelector, new_symbol);
            notifier.removeByCategory('activesymbol');
            setSymbol(new_symbol);
        };
        return (
            <React.Fragment>
                <ChartTitle onChange={symbolChange} isNestedList={isMobile} />
                {settingsRef.current.historical ? <ChartHistory onChange={handleDateChange} /> : ''}
                <Notification notifier={notifier} />
            </React.Fragment>
        );
    }, [notifier]);
    const renderControls = React.useCallback(() => <ChartSetting />, []);
    const renderToolbarWidget = React.useCallback(() => {
        const changeGranularity = (timePeriod: TGranularity) => setGranularity(timePeriod);
        const changeChartType = (_chartType?: string) => setChartType(_chartType);
        return (
            <ToolbarWidget>
                <ChartMode onChartType={changeChartType} onGranularity={changeGranularity} />
                <StudyLegend />
                <Views onChartType={changeChartType} onGranularity={changeGranularity} />
                <DrawTools />
                <Share />
            </ToolbarWidget>
        );
    }, []);
    const onMessage = (e: TNotification) => {
        notifier.notify(e);
    };
    const getIsChartReady = (isChartReady: boolean) => isChartReady;
    const onMarkerRef = (ref: TRefData | null) => {
        if (ref) {
            ref.setPosition({
                epoch: endEpoch,
            });
        }
    };
    const ref = React.useRef(null);

    return (
        <SmartChart
            ref={ref}
            id={chartId}
            chartStatusListener={(isChartReady: boolean) => getIsChartReady(isChartReady)}
            stateChangeListener={handleStateChange}
            isMobile={isMobile}
            symbol={symbol}
            settings={settings}
            onMessage={onMessage}
            enableRouting
            topWidgets={renderTopWidgets}
            toolbarWidget={renderToolbarWidget}
            chartControlsWidgets={renderControls}
            requestAPI={requestAPI}
            requestSubscribe={requestSubscribe}
            requestForget={requestForget}
            endEpoch={endEpoch}
            chartType={chartType}
            granularity={granularity}
            crosshairState={isMobile ? 0 : null}
            crosshairTooltipLeftAllow={660}
            onSettingsChange={saveSettings}
            isConnectionOpened={isConnectionOpened}
            networkStatus={networkStatus}
            shouldFetchTradingTimes
            shouldFetchTickHistory
            isLive
            enabledChartFooter
            allTicks={allTicks}
            contractInfo={contractInfo}
            getIndicatorHeightRatio={(chart_height: number, indicator_count: number) => {
                const isSmallScreen = chart_height < 780;
                const denominator = indicator_count >= 5 ? indicator_count : indicator_count + 1;
                const reservedHeight = isMobile ? 100 : 320;
                const indicatorsHeight = Math.round(
                    (chart_height - (reservedHeight + (isSmallScreen ? 20 : 0))) / denominator
                );
                return {
                    height: indicatorsHeight,
                    percent: indicatorsHeight / chart_height,
                };
            }}
        >
            {endEpoch ? (
                <Marker className='chart-marker-historical' markerRef={onMarkerRef}>
                    <span>
                        {moment(endEpoch * 1000)
                            .utc()
                            .format('DD MMMM YYYY - HH:mm')}
                    </span>
                </Marker>
            ) : (
                ''
            )}
        </SmartChart>
    );
};
ReactDOM.render(<App />, document.getElementById('root'));
