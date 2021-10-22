import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useStores } from 'src/store';
import RenderInsideChart from './RenderInsideChart';
import ChartTitle from './ChartTitle';
import Loader from './Loader';
import Barrier from './Barrier';
import BottomWidget from './BottomWidget';
import BottomWidgetsContainer from './BottomWidgetsContainer';
import NavigationWidget from './NavigationWidget';
import HighestLowestMarker from './HighestLowestMarker';
/* css + scss */
import '../../sass/main.scss';
import 'react-tabs/style/react-tabs.css';

import './ui';

import ChartControls from './ChartControls';
import ChartFooter from './ChartFooter';
import Crosshair from './Crosshair';
import { initGA, logPageView } from '../utils/ga';
import PaginationLoader from './PaginationLoader';

const Chart: React.FC = (props: any) => {
    const { chart, drawTools, studies, chartSetting, chartType, state, loader, timeperiod } = useStores();

    const { chartId, init, destroy, isChartAvailable, chartContainerHeight, containerWidth } = chart;
    const { StudySettingsDialog } = studies;
    const { DrawToolsSettingsDialog } = drawTools;
    const { AggregateChartSettingsDialog, isCandle, isSpline } = chartType;
    const { updateProps, isChartClosed } = state;
    const { theme, position, isHighestLowestMarkerEnabled } = chartSetting;
    const { PredictionIndicatorDialog } = timeperiod;
    const { isActive: isLoading } = loader;

    const rootRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        initGA();
        logPageView();
        updateProps(props);
        init(rootRef.current, props);

        return () => {
            destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        updateProps(props);
    });

    const defaultTopWidgets = () => <ChartTitle />;

    const {
        id,
        isMobile = false,
        barriers = [],
        children,
        chartControlsWidgets,
        topWidgets,
        bottomWidgets,
        enabledChartFooter = true,
        enabledNavigationWidget = true,
        toolbarWidget,
        onCrosshairChange,
    } = props;

    const hasPosition = chartControlsWidgets && position && !isMobile;
    const TopWidgets = topWidgets || defaultTopWidgets;
    // if there are any markers, then increase the subholder z-index
    const ToolbarWidget = toolbarWidget;

    return (
        <div
            id={id || chartId}
            className={classNames('smartcharts', `smartcharts-${theme}`, {
                'smartcharts--navigation-widget': enabledNavigationWidget,
                'smartcharts--loading': isLoading,
                'smartcharts--has-markers': children && children.length,
                [`smartcharts-${containerWidth}`]: !isMobile,
            })}
        >
            <div
                className={classNames({
                    'smartcharts-mobile': isMobile,
                    'smartcharts-desktop': !isMobile,
                })}
            >
                <div className='cq-context' ref={rootRef}>
                    <div
                        className={classNames({
                            [`cq-chart-control-${position}`]: hasPosition,
                            'cq-chart-control-bottom': !hasPosition,
                        })}
                    >
                        <div className='ciq-chart-area'>
                            <div className={classNames('ciq-chart', { 'closed-chart': isChartClosed })}>
                                <RenderInsideChart at='holder'>
                                    {barriers.map((barr: any, idx: any) => (
                                        <Barrier
                                            key={`barrier-${idx}`} // eslint-disable-line react/no-array-index-key
                                            {...barr}
                                        />
                                    ))}
                                </RenderInsideChart>
                                <RenderInsideChart at='subholder'>
                                    {!isCandle && !isSpline && isHighestLowestMarkerEnabled && <HighestLowestMarker />}
                                </RenderInsideChart>
                                <RenderInsideChart at='subholder' hideInScrollToEpoch>
                                    {children}
                                </RenderInsideChart>
                                <RenderInsideChart at='subholder'>
                                    <PaginationLoader />
                                </RenderInsideChart>
                                <div className='cq-top-ui-widgets'>
                                    <TopWidgets />
                                </div>
                                <div className='chartContainer' style={{ height: chartContainerHeight }}>
                                    <Crosshair />
                                </div>
                                {enabledNavigationWidget && <NavigationWidget onCrosshairChange={onCrosshairChange} />}
                                {toolbarWidget && <ToolbarWidget />}
                                {!isChartAvailable && (
                                    <div className='cq-chart-unavailable'>
                                        {t.translate('Chart data is not available for this symbol.')}
                                    </div>
                                )}
                                <BottomWidgetsContainer>
                                    <BottomWidget bottomWidgets={bottomWidgets} />
                                </BottomWidgetsContainer>
                            </div>
                            {chartControlsWidgets !== null && !enabledChartFooter && (
                                <ChartControls widgets={chartControlsWidgets} />
                            )}
                            {enabledChartFooter && <ChartFooter />}
                            <Loader />
                        </div>
                    </div>
                </div>
                <DrawToolsSettingsDialog />
                <AggregateChartSettingsDialog />
                <StudySettingsDialog />
                <PredictionIndicatorDialog />
                <div id='smartcharts_modal' className='ciq-modal' />
            </div>
        </div>
    );
};

export default observer(Chart);
