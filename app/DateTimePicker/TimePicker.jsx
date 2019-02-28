/* eslint-disable react/no-array-index-key */
/* eslint-disable react/no-did-update-set-state */
/* eslint-disable react/no-unused-state */
import { observer } from 'mobx-react';
import moment from 'moment';
import React from 'react';
import './time-picker.scss';
import { Wrapper } from '../../src/components/Icons.jsx';
import Time from '../icons/ic-time.svg';


const TimeIcon = Wrapper(Time);
const isSessionAvailable = (
    compare_moment          = moment().utc(),
    end_moment              = moment().utc(),
    should_only_check_hour  = false,
    sessions                = [],
) => {
    const offset = (new Date()).getTimezoneOffset() * 60 * 1000;
    const end_compare = should_only_check_hour
        ? end_moment.clone().minute(0).second(0) : end_moment;
    const start_compare = end_compare.clone().subtract(1, 'year');
    const end_time = end_compare.valueOf() + offset;
    const start_time = start_compare.valueOf() + offset;
    const compare_time = compare_moment.valueOf();
    let inSession = false;

    if (sessions && sessions.length) {
        const open_time = moment(sessions[0].open).valueOf() + offset;
        const close_time = moment(sessions[0].close).valueOf() + offset;
        inSession = (close_time > compare_moment.valueOf() && open_time <= compare_moment.valueOf());
    }

    return (
        (end_time - compare_time > 0)
        && (compare_time - start_time > 0)
        && inSession
    );
};

class TimePickerDropdown extends React.PureComponent {
    constructor(props) {
        super(props);
        this.hours    = [...Array(24).keys()].map(a => `0${a}`.slice(-2));
        this.minutes  = [...Array(12).keys()].map(a => `0${a * 5}`.slice(-2));
        this.state    = {
            is_hour_selected  : false,
            is_minute_selected: false,
            last_updated_type : null,
        };
    }

    componentDidUpdate(prevProps, prevState) {
        const { is_hour_selected, is_minute_selected } = this.state;
        if (is_hour_selected && is_minute_selected) {
            this.resetValues();
            this.props.toggle();
        }
        if (!prevProps.className && this.props.className === 'active') {
            this.resetValues();
        }
        if (prevState.last_updated_type !== this.state.last_updated_type && this.state.last_updated_type) {
            this.setState({ last_updated_type: null });
        }
    }

    selectOption = (type, value, is_enabled = true) => {
        if (is_enabled) {
            const [prev_hour, prev_minute] = (this.props.value || '00:00').split(':');
            const start_moment          = moment(this.props.start_date * 1000 || undefined);
            const start_moment_clone    = start_moment.clone().minute(0).second(0);

            if (
                (type === 'h' && value !== prev_hour)
                || (type === 'm' && value !== prev_minute)
            ) {
                const is_type_selected = type === 'h' ? 'is_hour_selected' : 'is_minute_selected';
                this.setState({
                    last_updated_type : type,
                    [is_type_selected]: true,
                });
                let selected_time = `${type === 'h' ? value : prev_hour}:${type === 'm' ? value : prev_minute}`;
                let desire_time = start_moment_clone.hour(type === 'h' ? value : prev_hour).minute(type === 'm' ? value : prev_minute);
                let last_available_min;

                if (type === 'h' && !isSessionAvailable(desire_time)) {
                    this.minutes.forEach((min) => {
                        desire_time = start_moment_clone.hour(value).minute(min);
                        if (isSessionAvailable(desire_time)) {
                            last_available_min = min;
                        }
                    });
                    if (last_available_min) {
                        selected_time = `${value}:${last_available_min}`;
                    }
                }

                this.props.onChange(selected_time);
            } else {
                this.props.toggle();
            }
        }
    };

    clear = (event) => {
        event.stopPropagation();
        this.resetValues();
        this.props.onChange('');
    };

    resetValues() {
        this.setState({
            is_hour_selected  : false,
            is_minute_selected: false,
        });
    }

    render() {
        const { preClass, value, toggle, start_date, end_moment, sessions } = this.props;
        const start_moment       = moment(start_date * 1000 || undefined);
        const start_moment_clone = start_moment.clone().minute(0).second(0);
        let [hour, minute] = ['00', '00'];
        if (value.match(/^([0-9]|[0-1][0-9]|2[0-3]):([0-9]|[0-5][0-9])(:([0-9]|[0-5][0-9]))?$/)) {
            [hour, minute] = value.split(':');
        }

        return (
            <div className={`${preClass}-dropdown ${this.props.className}`}>
                <div
                    className={`${preClass}-panel`}
                    onClick={toggle}
                >
                    <span className={value ? '' : 'placeholder'}>{t.translate(value || 'Select time')}</span>
                </div>
                <div className={`${preClass}-selector`}>
                    <div className={`${preClass}-hours`}>
                        <div className="list-title center-text"><strong>{t.translate('Hour')}</strong></div>
                        <div className="list-container">
                            {this.hours.map((h, key) => {
                                start_moment_clone.hour(h);
                                const is_enabled = isSessionAvailable(start_moment_clone, end_moment, true, sessions);
                                return (
                                    <div
                                        className={`list-item${hour === h ? ' selected' : ''}${is_enabled ? '' : ' disabled'}`}
                                        key={key}
                                        onClick={() => { this.selectOption('h', h, is_enabled); }}
                                    >
                                        {h}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className={`${preClass}-minutes`}>
                        <div className="list-title center-text"><strong>{t.translate('Minute')}</strong></div>
                        <div className="list-container">
                            {this.minutes.map((mm, key) => {
                                start_moment_clone.hour(hour).minute(mm);
                                const is_enabled = isSessionAvailable(start_moment_clone, end_moment, false, sessions);

                                return (
                                    <div
                                        className={`list-item${minute === mm ? ' selected' : ''}${is_enabled ? '' : ' disabled'}`}
                                        key={key}
                                        onClick={() => { this.selectOption('m', mm, is_enabled); }}
                                    >{mm}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class TimePicker extends React.PureComponent {
    constructor(props) {
        super(props);
        this.hours    = [...Array(24).keys()].map(a => `0${a}`.slice(-2));
        this.minutes  = [...Array(12).keys()].map(a => `0${a * 5}`.slice(-2));
        this.times    = [...Array(24).keys()].map(a => `0${a}`.slice(-2))
            .map(x => this.minutes.map(y => `${x}:${y}`).join('|'))
            .join('|')
            .split('|');
        this.state = {
            diffTime: 0,
            end_moment: moment().utc(),
            is_open: false,
            value : props.value || '00:00',
        };
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.focus === true
            && prevProps.focus !== this.props.focus
            && prevState.is_open !== this.props.focus) {
            this.toggleDropDown();
        }

        if (this.props.diffTime !== prevProps.diffTime) {
            this.updateEndTime();
        }

        if (this.props.sessions && prevProps.sessions) {
            const newSession = this.props.sessions && this.props.sessions[0];
            const oldSession = prevProps.sessions && prevProps.sessions.length ? prevProps.sessions[0] : null;
            if (newSession !== oldSession) {
                if (this.props.focus) {
                    const { sessions } = this.props;
                    const [prev_hour, prev_minute] = (prevState.value || '00:00').split(':');
                    const start_moment          = moment(this.props.start_date * 1000 || undefined);
                    const start_moment_clone    = start_moment.clone().minute(0).second(0);
                    const desire_time           = start_moment_clone.hour(prev_hour).minute(prev_minute);
                    if (!isSessionAvailable(desire_time, moment().utc(), false, sessions)) {
                        this.findAvailabeTime(start_moment_clone);
                    } else {
                        this.handleChange(this.state.value, true);
                    }
                }
            }
        }
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
    }

    updateEndTime = () => {
        const { diffTime } = this.props;
        const time = moment().utc().unix() - diffTime;
        const end_moment = moment(time * 1000).utc();
        this.setState({
            end_moment,
            diffTime,
        });
    }

    findAvailabeTime = (start_moment_clone) => {
        let desire_time;
        const { sessions } = this.props;
        const endTime = moment().utc();


        const first_available = this.times
            .find((x) => {
                const [hour, minute] = (x || '00:00').split(':');
                desire_time = start_moment_clone.hour(hour).minute(minute);
                return isSessionAvailable(desire_time, endTime, false, sessions);
            }) || '00:00';


        const [hour, minute] = (first_available || '00:00').split(':');
        desire_time = start_moment_clone.hour(hour).minute(minute);
        if (isSessionAvailable(desire_time, endTime, false, sessions)) {
            this.handleChange(`${first_available}`);
            this.setState({
                value: `${first_available}`,
            });
        } else {
            console.log('No available time for this date');
            if (this.state.value !== '00:00') {
                this.setState({ value: '00:00' });
            }
        }
    }

    toggleDropDown = () => {
        const is_open = this.state.is_open;
        this.setState({ is_open: !is_open });
    };

    handleChange = (arg, force) => {
        // To handle nativepicker;
        const value = typeof arg === 'object' ? arg.target.value : arg;

        this.setState({ value });
        if ((value !== this.props.value || force) && this.props.onChange) {
            this.props.onChange({ target: { name: this.props.name, value } });
        }
    };

    saveRef = (node) => {
        if (!node) return;
        if (node.nodeName === 'INPUT') {
            this.target_element = node;
            return;
        }
        this.wrapper_ref = node;
    };

    handleClickOutside = (event) => {
        if (this.wrapper_ref && !this.wrapper_ref.contains(event.target)) {
            if (this.state.is_open) {
                this.setState({ is_open: false });
                if (this.props.disableFocus) {
                    this.props.disableFocus();
                }
            }
        }
    };

    render() {
        const prefix_class = 'time-picker';
        const {
            is_nativepicker,
            name,
            is_align_right,
            placeholder,
            start_date,
            sessions,
        } = this.props;
        const { value } = this.state;
        return (
            <div
                ref={this.saveRef}
                className={`${prefix_class}${this.props.padding ? ' padding' : ''}${this.state.is_open ? ' active' : ''}`}
            >
                {
                    is_nativepicker
                        ? (
                            <input
                                type="time"
                                id={`${prefix_class}-input`}
                                value={value}
                                onChange={this.handleChange}
                                name={name}
                            />
                        )
                        : (
                            <React.Fragment>
                                <span
                                    onClick={this.toggleDropDown}
                                >
                                    <input
                                        ref={this.saveRef}
                                        type="text"
                                        readOnly
                                        id={`${prefix_class}-input`}
                                        className={`${prefix_class}-input ${this.state.is_open ? 'active' : ''}`}
                                        value={this.state.value}
                                        name={name}
                                        placeholder={placeholder}
                                    />
                                    <TimeIcon className="picker-time-icon" />
                                </span>
                                <TimePickerDropdown
                                    className={`${this.state.is_open ? 'active' : ''}${is_align_right ? ' from-right' : ''}`}
                                    toggle={this.toggleDropDown}
                                    onChange={this.handleChange}
                                    preClass={prefix_class}
                                    start_date={start_date}
                                    end_moment={this.state.end_moment}
                                    value={value}
                                    sessions={sessions}
                                    is_clearable={this.props.is_clearable}
                                />
                            </React.Fragment>
                        )
                }
            </div>
        );
    }
}

export default observer(TimePicker);
