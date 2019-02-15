/* eslint-disable no-new */
import { action, observable, when } from 'mobx';
import { createObjectFromLocalStorage, calculateTimeUnitInterval, calculateGranularity } from '../utils';

class ChartState {
    @observable granularity;
    @observable chartType;
    @observable startEpoch;
    @observable endEpoch;
    @observable symbol;
    @observable isConnectionOpened;
    @observable settings;
    get stxx() { return this.chartStore.stxx; }
    get context() { return this.chartStore.context; }

    constructor(mainStore) {
        this.chartStore = mainStore.chart;
        when(() => this.context, this.onContextReady);
    }

    onContextReady = () => {
        this.stxx.addEventListener('layout', this.saveLayout.bind(this));
        this.stxx.addEventListener('symbolChange', this.saveLayout.bind(this));
        this.stxx.addEventListener('drawing', this.saveDrawings.bind(this));

        setTimeout(() => {
            const masterData = this.stxx.masterData;
            const lastData = masterData[masterData.length - 1];
            const times = [];

            // Make points
            [1, 3, 5].forEach((x) => {
                times.push(lastData.DT.getTime() + (60 * 1000 * x));
            });

            /**
             * ### Add Bar
             * try adding invisible bar in the placess which
             * there are no bar.
             */
            times.forEach((ts) => {
                this.stxx.updateChartData(
                    {
                        DT: (new Date(ts)),
                        Close: null,
                    },
                    null,
                    { fillGaps: true },
                );
            });
            this.stxx.createDataSet();
            this.stxx.draw();

            setTimeout(() => {
                /**
                 * ### Add Marker
                 * adding marker on the points between interval range
                 * interval is 2 minues, so this code suppose to add
                 * marker within 1 minutes
                 */
                times.forEach((ts, indx) => {
                    const newNode = document.getElementById('stxEventPrototype').cloneNode(true);
                    newNode.id = null;
                    newNode.innerHTML = indx;
                    CIQ.appendClassName(newNode, 'dividend');
                    new CIQ.Marker({
                        stx: this.stxx,
                        yPositioner: 'top',
                        x: (new Date(ts)),
                        label: 'events',
                        node: newNode,
                    });
                });
                this.stxx.draw();
            }, 800);
        }, 800);
    };

    @action.bound updateProps({ id, settings, isConnectionOpened, symbol, granularity, chartType, startEpoch, endEpoch, isAnimationEnabled = true }) {
        this.chartId = id;
        this.settings = settings;
        this.isConnectionOpened = isConnectionOpened;
        this.symbol = symbol;
        this.granularity = granularity;
        this.chartType = chartType;
        this.startEpoch = startEpoch;
        this.endEpoch = endEpoch;
        this.isAnimationEnabled = isAnimationEnabled;
    }

    saveLayout() {
        if (!this.chartId) return;
        const layoutData = this.stxx.exportLayout(true);
        const json = JSON.stringify(layoutData);
        CIQ.localStorageSetItem(`layout-${this.chartId}`, json);
    }

    // returns false if restoring layout fails
    restoreLayout() {
        let layoutData = createObjectFromLocalStorage(`layout-${this.chartId}`);

        if (!layoutData) return false;

        // prop values will always take precedence
        if (this.symbol !== undefined && this.symbol !== layoutData.symbols[0].symbol) {
            // symbol prop takes precedence over local storage data
            const symbolObject = this.chartStore.activeSymbols.getSymbolObj(this.symbol);
            layoutData.symbols = [{ symbol: this.symbol, symbolObject }];
        }

        for (const symbolDat of layoutData.symbols) {
            // Symbol from cache may be in different language, so replace it with server's
            const { symbol: cachedSymbol } = symbolDat;
            const updatedSymbol = this.chartStore.activeSymbols.getSymbolObj(cachedSymbol);
            symbolDat.symbolObject = updatedSymbol;
            if (symbolDat.parameters) {
                symbolDat.parameters.display = updatedSymbol.name;

                // These gap settings are default when new comparisons are added,
                // but for backward support we need to set them here.
                symbolDat.parameters.fillGaps = true;
                symbolDat.parameters.gapDisplayStyle = true;
            }
        }

        if (this.granularity !== undefined) {
            const periodicity = calculateTimeUnitInterval(this.granularity);
            layoutData = { ...layoutData, ...periodicity };
        } else {
            // update this.granularity with chartLayout
            const { timeUnit, interval } = layoutData;
            if (timeUnit) {
                this.chartStore.granularity = calculateGranularity(interval, timeUnit);
            } else {
                this.chartStore.granularity = 86400; // 1 day
            }
        }

        if (this.startEpoch || this.endEpoch) {
            // already set in chart params
            delete layoutData.span;
            delete layoutData.range;
        }

        if (this.chartType !== undefined) {
            layoutData.chartType = this.chartType;
        }

        this.stxx.importLayout(layoutData, {
            managePeriodicity: true,
            cb: () => {
                if (layoutData.tension) {
                    this.stxx.chart.tension = layoutData.tension;
                }
                this.restoreDrawings(this.stxx, this.stxx.chart.symbol);
                if (this.chartStore.loader) {
                    this.chartStore.loader.hide();
                }

                this.chartStore.setMainSeriesDisplay(this.stxx.chart.symbolObject.name);
            },
        });

        this.chartStore.updateCurrentActiveSymbol();

        return true;
    }

    saveDrawings() {
        if (!this.chartId) return;
        const obj = this.stxx.exportDrawings();
        const symbol = this.stxx.chart.symbol;
        if (obj.length === 0) {
            CIQ.localStorage.removeItem(`${symbol}-${this.chartId}`);
        } else {
            CIQ.localStorageSetItem(`${symbol}-${this.chartId}`, JSON.stringify(obj));
        }
    }

    restoreDrawings() {
        const drawings = createObjectFromLocalStorage(`${this.stxx.chart.symbol}-${this.chartId}`);
        if (drawings) {
            this.stxx.importDrawings(drawings);
            this.stxx.draw();
        }
    }
}

export default ChartState;
