import React from 'react';
import { ItemIconMap } from '../Icons';
import Favorite from '../Favorite';
import { TProcessedSymbolItem, TSubCategoryDataItem } from '../../binaryapi/ActiveSymbols';

export type TBaseItemProps = {
    item: TSubCategoryDataItem;
    favoritesId: string;
};

export type TNormalItemProps = TBaseItemProps & {
    onSelectItem?: (item: TProcessedSymbolItem) => void;
    disableAll?: boolean;
};

const Icon = React.memo(({ id }: { id: string }) => {
    if (!id || !ItemIconMap[id as keyof typeof ItemIconMap]) {
        return null;
    }
    const ItemIcon = ItemIconMap[id as keyof typeof ItemIconMap];
    return <ItemIcon className={`ic-${id}`} />;
});

const ItemName = React.memo(({ item: { itemId, display } }: { item: TSubCategoryDataItem }) => (
    <div className='sc-mcd__item__name'>
        <Icon id={itemId} />
        {display}
    </div>
));

const ItemDetail = React.memo(
    ({ favoritesId, item: { dataObject, itemId } }: { favoritesId: string; item: TSubCategoryDataItem }) => (
        <div className='sc-mcd__item__detail'>
            {dataObject && (dataObject.market === 'forex' || dataObject.exchange_is_open === undefined || dataObject.exchange_is_open) ? (
                ''
            ) : (
                <span className='closed-market'>{t.translate('CLOSED')}</span>
            )}
            <Favorite category={favoritesId} id={itemId} />
        </div>
    )
);

const NormalItemBase = ({ onSelectItem, item, favoritesId }: TNormalItemProps) => (
    <div
        className={`sc-mcd__item sc-mcd__item--${item.itemId} ${item.selected ? 'sc-mcd__item--selected ' : ''}`}
        onClick={() => item.enabled && onSelectItem?.(item.dataObject)}
    >
        <ItemName item={item} />
        <ItemDetail item={item} favoritesId={favoritesId} />
    </div>
);

const NormalItem = React.memo(NormalItemBase);

export default NormalItem;
