import React from 'react';
import classNames from 'classnames';
import { CloseCircleIcon, SearchIcon } from './Icons';
import '../../sass/components/_search.scss';

type TSearchInputProps = {
    placeholder: string;
    value: string;
    searchInput: React.RefObject<HTMLInputElement>;
    searchInputClassName: string;
    onChange: (value: string) => void;
};

const SearchInput: React.FC<TSearchInputProps> = ({
    placeholder,
    value,
    searchInput,
    searchInputClassName,
    onChange,
}) => (
    <div className={classNames('sc-search-input', { active: value.trim() !== '' })}>
        <input
            className={searchInputClassName}
            value={value}
            ref={searchInput}
            onChange={(e: any) => onChange(e.target.value)}
            type='text'
            spellCheck='false'
            autoComplete='off'
            autoCorrect='off'
            autoCapitalize='off'
            placeholder={placeholder}
        />
        <SearchIcon />
        <CloseCircleIcon className='icon-reset' onClick={() => onChange('')} />
    </div>
);

export default SearchInput;