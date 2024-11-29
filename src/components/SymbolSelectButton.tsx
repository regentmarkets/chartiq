import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useStores } from 'src/store';
import AnimatedPriceStore from 'src/store/AnimatedPriceStore';
import ChartTitleStore from 'src/store/ChartTitleStore';
import { ItemIconMap, SymbolPlaceholderIcon, ArrowIcon, TimeIcon } from './Icons';
import { MarketOpeningTimeCounter } from './MarketOpeningTimeCounter';
import AnimatedPrice from './AnimatedPrice';

type TChartPriceProps = {
    isVisible: boolean;
    status: AnimatedPriceStore['status'];
    todayChange: ChartTitleStore['todayChange'];
    todayChangePercent: ChartTitleStore['todayChangePercent'];
};

type TClosedSymbolProps = {
    symbolOpenTime: ChartTitleStore['symbolOpenTime'];
};

const SymbolInfoBase = () => {
    const { chartTitle } = useStores();

    const {
        isShowChartPrice,
        isVisible,
        todayChange,
        todayChangePercent,
        animatedPrice,
        currentSymbol: symbol,
        isSymbolOpen,
        symbolOpenTime,
    } = chartTitle;
    const { status } = animatedPrice;

    if (!symbol) return null;

    const SymbolIcon = ItemIconMap[symbol.symbol as keyof typeof ItemIconMap] || SymbolPlaceholderIcon;
    const hasOpenTime = !isSymbolOpen && symbolOpenTime.openTime;
    const hasNoOpenTime = !isSymbolOpen && !symbolOpenTime.openTime;
    return (
        <>
            {SymbolIcon && <SymbolIcon className={`ic-${symbol.symbol}`} />}
            <div className='cq-symbol-info'>
                <div className={classNames('cq-symbol', { 'closed-no-opentime': hasNoOpenTime })}>{symbol.name}</div>
                {isSymbolOpen && (
                    <ChartPrice
                        status={status}
                        isVisible={isVisible && isShowChartPrice}
                        todayChange={todayChange}
                        todayChangePercent={todayChangePercent}
                    />
                )}
                {hasOpenTime && <ClosedSymbol symbolOpenTime={symbolOpenTime} />}
            </div>
        </>
    );
};

export const SymbolInfo = observer(SymbolInfoBase);

const SymbolSelectButtonBase = () => {
    const { chartTitle } = useStores();
    const { isSymbolOpen, currentActiveCategory } = chartTitle;
    const is_forex_market = currentActiveCategory === 'forex';
    return (
        <div className='cq-symbol-select-btn'>
            <div className='cq-symbol-select-btn__container'>
                <SymbolInfo />
                {!isSymbolOpen && !is_forex_market && <div className='cq-symbol-closed-text'>{t.translate('CLOSED')}</div>}
            </div>
            <ArrowIcon className='cq-symbol-dropdown' />
        </div>
    );
};
export const SymbolSelectButton = observer(SymbolSelectButtonBase);

const ChartPriceBase = ({ isVisible, status, todayChange, todayChangePercent }: TChartPriceProps) => {
    const { chartTitle } = useStores();
    const { animatedPrice, decimalPlaces } = chartTitle;
    const { price, isIncrease } = animatedPrice;
    return isVisible ? (
        <div className='cq-chart-price'>
            <AnimatedPrice
                className='cq-current-price'
                price={price}
                isIncrease={isIncrease}
                status={animatedPrice.status}
                decimalPlaces={decimalPlaces}
            />
            <div className='divider'>-</div>
            <div className={classNames('cq-change', status)}>
                <span className='cq-todays-change'>{todayChange || 0}</span>
                <span className='cq-todays-change-percent'>({todayChangePercent}%)</span>&nbsp;
            </div>
        </div>
    ) : null;
};

export const ChartPrice = observer(ChartPriceBase);

const ClosedSymbol = ({ symbolOpenTime }: TClosedSymbolProps) => (
    <div className='cq-chart-closed'>
        <TimeIcon className='cq-closed-icon' />
        <div className='cq-closed-opening'>
            {t.translate('Opens in:')} &nbsp;
            <span className='cq-closed-opening-time'>
                <MarketOpeningTimeCounter symbolOpenTime={symbolOpenTime} />
            </span>
        </div>
    </div>
);
