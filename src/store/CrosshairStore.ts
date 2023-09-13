import { action, computed, observable, when, makeObservable } from 'mobx';
import moment from 'moment';
import Context from 'src/components/ui/Context';
import { TQuote } from 'src/types';
import { getTooltipLabels } from 'src/Constant';
import MainStore from '.';

type TDupMap = {
    [key: string]: number;
};

type TRow = {
    name: string;
    value: string;
};

type TUpdateTooltipPositionParams = {
    left: number;
    top: number;
    rows: TRow[] | null;
};

type TCrosshairRefs = {
    crosshairRef: React.RefObject<HTMLDivElement>;
    crossHairXRef: React.RefObject<HTMLDivElement>;
    crossHairYRef: React.RefObject<HTMLDivElement>;
    floatDateRef: React.RefObject<HTMLDivElement>;
    floatPriceRef: React.RefObject<HTMLDivElement>;
};

const MAX_TOOLTIP_WIDTH = 315;

interface DrawingCounter {
    [key: string]: { count: number };
}

const initialDrawingClick: DrawingCounter = {
    vertical: { count: 0 },
    ray: { count: 0 },
    trend: { count: 0 },
    horizontal: { count: 0 },
    line: { count: 0 },
    continuous: { count: 0 },
    channel: { count: 0 },
    rectangle: { count: 0 },
    fibfan: { count: 0 },
};

class CrosshairStore {
    mainStore: MainStore;
    prev_arrow?: string;

    state?: number = 2;

    constructor(mainStore: MainStore) {
        makeObservable(this, {
            activeSymbol: computed,
            decimalPlaces: computed,
            state: observable,
            toggleState: action.bound,
            updateProps: action.bound,
            setCrosshairState: action.bound,
        });

        this.mainStore = mainStore;
    }
    get activeSymbol() {
        return this.mainStore.chart.currentActiveSymbol;
    }
    get decimalPlaces() {
        return this.activeSymbol?.decimal_places || 2;
    }
    get showOhl(): boolean {
        return this.mainStore.timeperiod.timeUnit !== 'tick' && this.mainStore.chartType.isCandle;
    }
    get context(): Context | null {
        return this.mainStore.chart.context;
    }

    get isChartReady() {
        return this.mainStore.state.isChartReady;
    }

    node = null;
    showChange = false;
    showSeries = false;
    showStudies = false;
    isDrawingRegistered = false;
    drawingCounter = initialDrawingClick;
    selectedDrawing = '';
    refs?: TCrosshairRefs;

    isOverChartContainer = false;

    onCrosshairChanged: (state?: number) => void = () => null;

    onMount = async (refs: TCrosshairRefs) => {
        await when(() => this.mainStore.chartAdapter.isChartLoaded);
        const contentWindow = document.querySelector('.chartContainer');
        if (contentWindow) {
            contentWindow.addEventListener('mouseover', this.onMouseOver);
            contentWindow.addEventListener('mouseout', this.onMouseOut);
        }
        this.refs = refs;
    };

    onUnmount = () => {
        const contentWindow = document.querySelector('.chartContainer');
        if (contentWindow) {
            contentWindow.removeEventListener('mouseover', this.onMouseOver);
            contentWindow.removeEventListener('mouseout', this.onMouseOut);
        }
        this.refs = undefined;
    };

    onMouseMove = (dx: number, dy: number, epoch: number, quote: string) => {
        if (!this.isOverChartContainer) return;

        this.setPositions(dx, dy, epoch, quote);
        this.renderCrosshairTooltip(dx, dy);

        this.mainStore.crosshair.updateVisibility(true);
    };

    onMouseOver = () => {
        this.isOverChartContainer = true;
        this.updateVisibility(true);
    };

    onMouseOut = () => {
        this.isOverChartContainer = false;
        this.updateVisibility(false);
    };

    toggleState() {
        const state = ((this.state as number) + 1) % 3;
        this.setCrosshairState(state);
    }
    updateProps(onChange?: () => void) {
        this.onCrosshairChanged = onChange || (() => null);
    }

    setPositions = (offsetX: number, offsetY: number, epoch: number, quote: string) => {
        if (!this.refs) return;
        const { crossHairXRef, crossHairYRef, floatDateRef, floatPriceRef } = this.refs;

        if (crossHairXRef.current) crossHairXRef.current.style.transform = `translate(${offsetX}px, 0px)`;
        if (crossHairYRef.current) crossHairYRef.current.style.transform = `translate(0px, ${offsetY}px)`;
        if (floatDateRef.current) {
            const width = floatDateRef.current.clientWidth;
            floatDateRef.current.innerText = moment.utc(epoch).format(this.getDateTimeFormat());
            floatDateRef.current.style.transform = `translate(${offsetX - width / 2}px, 0px)`;
        }
        if (floatPriceRef.current) {
            const height = floatPriceRef.current.clientHeight;
            const price = this.mainStore.chartAdapter.getQuoteFromY(offsetY);

            if (price >= 0) {
                const quoteLabel = Number(quote).toFixed(this.mainStore.chart.pip);
                floatPriceRef.current.innerText = `${quoteLabel}`;
            }
            floatPriceRef.current.style.transform = `translate(0px, ${offsetY - height / 2}px)`;
        }
    };

    setCrosshairState(state?: number) {
        if (!this.context) {
            return;
        }
        this.state = state;

        this.mainStore.state.crosshairState = state;
        this.mainStore.state.saveLayout();
        this.onCrosshairChanged(this.state);

        const isCrosshairVisible = state !== 0;
        this.mainStore.chartAdapter.flutterChart?.config.updateCrosshairVisibility(isCrosshairVisible);
    }
    renderCrosshairTooltip = (offsetX: number, offsetY: number) => {
        // if no tooltip exists, then skip
        if (this.state !== 2) return;

        if (!this.mainStore.chartAdapter.isChartLoaded) return;

        const epoch = this.mainStore.chartAdapter.getEpochFromX(offsetX);

        const quotes = this.mainStore.chart.feed?.quotes || [];
        const lastQuote = quotes[quotes.length - 1];
        const lastQuoteEpoch = lastQuote?.DT?.getTime();
        const granularity = this.mainStore.chartAdapter.getGranularityInMs();
        const nextQuoteEpoch = lastQuoteEpoch ? lastQuoteEpoch + granularity / 2 : epoch;

        const quoteBar =
            epoch <= nextQuoteEpoch ? this.mainStore.chart.feed?.getClosestQuoteForEpoch(epoch) : undefined;

        let rows = [] as TRow[];

        if (quoteBar) {
            rows = this.calculateRows(quoteBar);
        }

        const closestEpoch = this.mainStore.chart.feed?.getClosestValidEpoch(epoch, granularity);

        const indicatorsRows = this.getIndicatorRows(quoteBar?.DT?.getTime() || closestEpoch || epoch);
        rows.push(...indicatorsRows);

        if (rows.length === 0 || !this.isChartReady) {
            this.updateTooltipPosition({ left: -5000, top: 0, rows: null });
        } else {
            this.updateTooltipPosition({
                left: offsetX,
                top: offsetY,
                rows,
            });
        }
    };

    setDrawingCount = (selectedDrawingName: string, isContinuous?: boolean) => {
        // Loop over all keys in drawingCounter and reset them to zero,
        // except for the selectedDrawingName
        for (const key in this.drawingCounter) {
            if (key !== selectedDrawingName) {
                this.drawingCounter[key].count = 0;
            }
        }
        const selectDrawing = this.drawingCounter[selectedDrawingName];
        // Increment the count of the selected drawing type, up to a maximum of 2
        if (selectDrawing.count < 2 || isContinuous) {
            selectDrawing.count++;
        }
    };

    handleDrawing = (selectedDrawingName: string) => {
        switch (selectedDrawingName) {
            case 'vertical': {
                this.setDrawingCount(selectedDrawingName);
                this.mainStore.drawTools.onCreation('vertical');

                this.onDeletedDrawing();
                break;
            }
            case 'horizontal': {
                this.setDrawingCount(selectedDrawingName);
                this.mainStore.drawTools.onCreation('horizontal');
                this.onDeletedDrawing();
                break;
            }
            case 'line':
                this.setDrawingCount(selectedDrawingName);
                if (this.drawingCounter[selectedDrawingName].count === 2) {
                    this.mainStore.drawTools.onCreation(selectedDrawingName);
                    // const contentWindow = document.querySelector('.chartContainer') as HTMLElement;
                    // contentWindow.style.pointerEvents = 'none';
                    this.onDeletedDrawing();
                }
                break;
            case 'ray':
                this.setDrawingCount(selectedDrawingName);
                if (this.drawingCounter[selectedDrawingName].count === 2) {
                    this.mainStore.drawTools.onCreation(selectedDrawingName);
                    this.onDeletedDrawing();
                }
                break;
            case 'trend':
                this.setDrawingCount(selectedDrawingName);
                if (this.drawingCounter[selectedDrawingName].count === 2) {
                    this.mainStore.drawTools.onCreation(selectedDrawingName);
                    this.onDeletedDrawing();
                }
                break;
            case 'rectangle':
                this.setDrawingCount(selectedDrawingName);
                if (this.drawingCounter[selectedDrawingName].count === 2) {
                    this.mainStore.drawTools.onCreation(selectedDrawingName);
                    this.onDeletedDrawing();
                }
                break;
            case 'fibfan':
                this.setDrawingCount(selectedDrawingName);
                if (this.drawingCounter[selectedDrawingName].count === 2) {
                    this.mainStore.drawTools.onCreation(selectedDrawingName);
                    this.onDeletedDrawing();
                }
                break;
            case 'channel':
                this.setDrawingCount(selectedDrawingName);
                if (this.drawingCounter[selectedDrawingName].count === 3) {
                    this.mainStore.drawTools.onCreation(selectedDrawingName);
                    this.onDeletedDrawing();
                }
                break;
            case 'continuous':
                this.setDrawingCount(selectedDrawingName);
                if (this.drawingCounter[selectedDrawingName].count > 1) {
                    this.mainStore.drawTools.onCreation(selectedDrawingName);
                }
                break;
            default:
                console.warn(`Unsupported drawing name: ${selectedDrawingName}`);
        }
    };

    onDeletedDrawing = () => {
        this.drawingCounter = JSON.parse(JSON.stringify({ ...initialDrawingClick }));
    };

    selectedDrawingHoverClick = async () => {
        await when(() => this.mainStore.chartAdapter.isChartLoaded);

        const contentWindow = document.querySelector('.chartContainer') as HTMLElement;

        if (!contentWindow || this.isDrawingRegistered) return;

        this.isDrawingRegistered = true;

        contentWindow.addEventListener('mousedown', e => {
            e.stopPropagation();
            e.preventDefault();
            if (contentWindow) {
                // contentWindow.style.pointerEvents = 'none';
            }

            const drawTools = this.mainStore.chartAdapter.flutterChart?.drawingTool.getDrawingTools();
            if (!drawTools || drawTools.selectedDrawingTool === null) return;

            if (drawTools.drawingToolsRepo._addOns.length === 0) {
                this.onDeletedDrawing();
            }
            const selectedDrawingName = this.mainStore.chartAdapter.flutterChart?.drawingTool.getTypeOfSelectedDrawingTool(
                drawTools.selectedDrawingTool
            );

            if (selectedDrawingName) {
                this.handleDrawing(selectedDrawingName);
            }
        });
    };

    renderDrawingToolToolTip = (name: string, dx: number, dy: number) => {
        if (document.getElementsByClassName('draw-tool-tooltip').length === 0) {
            const chartContainer: HTMLElement | null | undefined = this.context?.topNode?.querySelector(
                '.chartContainer'
            );

            const parentDiv = document.createElement('div');
            parentDiv.classList.add('draw-tool-tooltip', 'mSticky');
            parentDiv.classList.add('indicator-tooltip', 'mSticky');
            parentDiv.style.display = 'inline-block';
            parentDiv.style.position = 'absolute';
            parentDiv.style.top = `${dy - 100}px`;
            parentDiv.style.left = `${dx - 150}px`;

            parentDiv.innerHTML = `
                    <span class='mStickyInterior' style='display:inline-block'>${name}</span>
                    <span class='mouseDeleteInstructions'>Right click to manage</span>
        `;

            chartContainer?.appendChild(parentDiv);
        }
    };

    renderIndicatorToolTip = (name: string, dx: number, dy: number) => {
        if (document.getElementsByClassName('indicator-tooltip').length === 0) {
            const chartContainer: HTMLElement | null | undefined = this.context?.topNode?.querySelector(
                '.chartContainer'
            );

            const parentDiv = document.createElement('div');
            parentDiv.classList.add('draw-tool-tooltip', 'mSticky');
            parentDiv.classList.add('indicator-tooltip', 'mSticky');
            parentDiv.style.display = 'inline-block';
            parentDiv.style.position = 'absolute';
            parentDiv.style.top = `${dy - 100}px`;
            parentDiv.style.left = `${dx - 150}px`;

            parentDiv.innerHTML = `
                    <span class='mStickyInterior' style='display:inline-block'>${name}</span>
                    <span class='mouseDeleteInstructions'>Right click to manage</span>
        `;

            chartContainer?.appendChild(parentDiv);
        }
    };

    removeDrawingToolToolTip = () => {
        if (document.getElementsByClassName('draw-tool-tooltip').length > 0) {
            document.getElementsByClassName('draw-tool-tooltip')[0].remove();
        }
    };

    removeIndicatorToolTip = () => {
        if (document.getElementsByClassName('indicator-tooltip').length > 0) {
            document.getElementsByClassName('indicator-tooltip')[0].remove();
        }
    };
    calculateRows(data: TQuote) {
        const dupMap = {} as TDupMap;
        const fields: {
            member: string;
            display: string;
        }[] = [];

        // Access main chart panel and yAxis in this scope:
        fields.push({
            member: 'DT',
            display: 'DT',
        });
        dupMap.DT = dupMap.Close = 1;
        if (this.showChange) {
            fields.push({
                member: 'Change',
                display: 'Change',
            });
        }
        if (this.showOhl) {
            for (const el of ['Open', 'Close', 'High', 'Low']) {
                fields.push({
                    member: el,
                    display: el,
                });
            }
            dupMap.Open = dupMap.High = dupMap.Low = 1;
        }
        if (this.activeSymbol?.name) {
            const display = this.activeSymbol?.name as string;
            fields.push({
                member: 'Close',
                display,
            });
        }

        const rows = [];
        for (const obj of fields) {
            const { member: name, display: displayName } = obj;

            let dsField = data[name as keyof typeof data];

            if (['Open', 'Close', 'High', 'Low'].includes(name)) {
                dsField = Number(dsField).toFixed(this.mainStore.chart.pip);
            }

            const fieldName = displayName?.replace(/^(Result )(.*)/, '$2');
            if (dsField && (name === 'DT' || typeof dsField !== 'object')) {
                let fieldValue = '';
                if (dsField.constructor === Number) {
                    fieldValue = dsField.toString();
                } else if (dsField.constructor === Date) {
                    fieldValue = moment(dsField).format(this.getDateTimeFormat());
                } else {
                    fieldValue = dsField as string;
                }
                rows.push({
                    name: fieldName.toUpperCase(),
                    value: fieldValue,
                });
            }
        }

        return rows;
    }

    getIndicatorRows = (epoch: number) => {
        const rows: TRow[] = [];
        const tooltipContent = window.flutterChart.app.getTooltipContent(epoch, this.decimalPlaces || 2);

        const activeItems = this.mainStore.studies.activeItems || [];

        tooltipContent
            .filter(c => c)
            .forEach((item, index) => {
                const labels = getTooltipLabels(item.name, activeItems[index])?.labels || [];

                labels.forEach((label, i) => {
                    const value = item.values[i];
                    if (!value) return;

                    rows.push({
                        name: label,
                        value,
                    });
                });
            });

        return rows;
    };

    updateVisibility = (visible: boolean) => {
        const crosshair = this.refs?.crosshairRef.current;
        if (crosshair) {
            if (visible) crosshair.classList.add('active');
            else crosshair.classList.remove('active');
        }
    };

    // YES! we are manually patching DOM, Because we don't want to pay
    // for react reconciler & mox tracking observables.
    updateTooltipPosition({ top, left, rows }: TUpdateTooltipPositionParams) {
        const crosshair: HTMLElement | null | undefined = this.context?.topNode?.querySelector('.cq-crosshair-tooltip');

        if (crosshair) {
            crosshair.style.transform = `translate(${left}px, ${top}px)`;
            const tooltipRightLimit = this.mainStore.state.crosshairTooltipLeftAllow || MAX_TOOLTIP_WIDTH;
            const arrow = left <= tooltipRightLimit ? 'arrow-left' : 'arrow-right';
            if (arrow !== this.prev_arrow) {
                if (this.prev_arrow) {
                    crosshair.classList.remove(this.prev_arrow);
                }
                crosshair.classList.add(arrow);
                this.prev_arrow = arrow;
            }
            // if there is a need to update the rows.
            if (rows !== null) {
                const content = crosshair.querySelector('.cq-crosshair-content');
                if (content) {
                    content.innerHTML = rows
                        .map(
                            (r: TRow) => `
                <div class="row">
                    <span>${r.name !== 'DT' ? r.name : r.value}</span>
                    <span>${r.name !== 'DT' ? r.value : ''}</span>
                </div>
            `
                        )
                        .join('');
                }
            }
        }
    }

    getDateTimeFormat = () => {
        switch (this.mainStore.timeperiod.timeUnit) {
            case 'day':
                return 'DD/MM/YYYY';
            case 'hour':
            case 'minute':
                return 'DD/MM HH:mm';
            case 'tick':
                return 'DD/MM HH:mm:ss';
            default:
                return 'DD/MM HH:mm';
        }
    };
}
export default CrosshairStore;
