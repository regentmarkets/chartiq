import React from 'react';
import ReactDOM from 'react-dom';
import { CSSTransition } from 'react-transition-group';

import classNames from 'classnames';
import MenuMobile from './MenuMobile';
import Tooltip from './Tooltip';
import { CloseIcon } from './Icons';
import { TDialogProps } from './Dialog';
import { TReactComponent } from '../store/Connect';
import ChartStore from '../store/ChartStore';

export type TMenuProps = {
    open: boolean;
    dialogStatus?: boolean;
    className: string;
    children: React.ReactNode;
    title: string;
    tooltip?: boolean;
    onTitleClick: () => void;
    DropdownDialog: TReactComponent<Partial<TDialogProps | ChartStore> & { isFullscreen: TMenuProps['isFullscreen'] }>;
    isMobile: boolean;
    isFullscreen: boolean;
    portalNodeId: string;
    enabled: boolean;
    shouldRenderDialogs: boolean;
    handleCloseDialog: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    theme: string;
    enableTabular: boolean;
    ready: boolean;
    customHead: JSX.Element;
    emptyMenu: boolean;
    modalMode: boolean;
};

const Menu = ({
    open,
    dialogStatus,
    className,
    children,
    title,
    tooltip,
    onTitleClick,
    DropdownDialog,
    isMobile,
    isFullscreen,
    portalNodeId,
    enabled = true,
    shouldRenderDialogs,
    handleCloseDialog,
    onMouseEnter,
    onMouseLeave,
    theme,
    enableTabular,
    ready,
    customHead,
    emptyMenu,
    modalMode,
}: TMenuProps): React.ReactNode => {
    const onOverlayClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLDivElement).className === 'cq-modal__overlay') {
            handleCloseDialog();
        }
    };

    if (!ready) return '';

    const first = React.Children.map(children, (child: React.ReactNode, i: number) => (i === 0 ? child : null));
    const rest = React.Children.map(children, (child: React.ReactNode, i: number) => (i !== 0 ? child : null));
    if (modalMode) {
        const portalNode = document.getElementById(portalNodeId || 'smartcharts_modal');
        if (!portalNode) return '';

        const newDialog = ReactDOM.createPortal(
            <div className={`smartcharts-${theme}`}>
                <div
                    className={classNames({
                        'smartcharts-mobile': isMobile,
                        'smartcharts-desktop': !isMobile,
                    })}
                >
                    <div
                        className={classNames('cq-modal-dropdown', className, {
                            stxMenuActive: open,
                        })}
                    >
                        <div className='cq-modal__overlay' onClick={onOverlayClick}>
                            <CSSTransition appear in={dialogStatus} timeout={300} classNames='sc-dialog' unmountOnExit>
                                <DropdownDialog
                                    isMobile={isMobile}
                                    isFullscreen={isFullscreen}
                                    title={title}
                                    handleCloseDialog={handleCloseDialog}
                                    enableTabular={enableTabular}
                                    customHead={customHead}
                                >
                                    {rest}
                                </DropdownDialog>
                            </CSSTransition>
                        </div>
                    </div>
                </div>
            </div>,
            portalNode
        );

        if (emptyMenu) {
            return open && newDialog;
        }

        return (
            <Tooltip
                className={classNames('ciq-menu', className || '', {
                    stxMenuActive: enabled && open,
                    'ciq-enabled': enabled,
                    'ciq-disabled': !enabled,
                })}
                content={tooltip}
                enabled={tooltip}
                position='right'
            >
                <div
                    className='cq-menu-btn'
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onClick={enabled ? onTitleClick : () => null}
                >
                    {first}
                </div>
                {enabled && open && newDialog}
            </Tooltip>
        );
    }

    const oldDropdown = shouldRenderDialogs ? (
        <DropdownDialog
            className={classNames('cq-menu-dropdown', {
                'cq-menu-dropdown-enter-done': dialogStatus,
            })}
            isMobile={isMobile}
            isFullscreen={isFullscreen}
        >
            {title && (
                <div className='title'>
                    <div className='title-text'>{title}</div>
                    <CloseIcon className='icon-close-menu' onClick={onTitleClick} />
                </div>
            )}
            {rest}
        </DropdownDialog>
    ) : null;

    return (
        (enabled && (
            <div className={classNames('ciq-menu ciq-enabled', className, { stxMenuActive: open })}>
                <div
                    className='cq-menu-btn'
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onClick={onTitleClick}
                >
                    {first}
                </div>
                {(isMobile && portalNodeId && (
                    <MenuMobile
                        className={className}
                        open={open}
                        menu_element={oldDropdown}
                        portalNodeId={portalNodeId}
                        onClick={onOverlayClick}
                    />
                )) ||
                    oldDropdown}
            </div>
        )) || (
            <div className={classNames('ciq-menu ciq-disabled', className)}>
                <div className='cq-menu-btn' onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                    {first}
                </div>
            </div>
        )
    );
};

Menu.Title = ({ children }: TMenuProps) => children;
Menu.Body = ({ children }: TMenuProps) => children;

export default Menu;
