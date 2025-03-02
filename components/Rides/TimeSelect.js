import React from 'react';
import { Select } from 'antd';
import moment from 'moment';

const { Option } = Select;

// Utility function to generate time options in 5-minute intervals
const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const formattedHour = hour.toString().padStart(2, '0');
            const formattedMinute = minute.toString().padStart(2, '0');
            times.push(`${formattedHour}:${formattedMinute}`);
        }
    }
    return times;
};

const TimeSelect = ({ value, onChange, className, currentDate }) => {
    const now = moment();
    const isToday = currentDate && currentDate.isSame(now, 'day');

    // Ensure the value is a properly formatted string
    const displayValue = value ?
        (moment.isMoment(value) ? value.format('HH:mm') : value)
        : undefined;

    // Filter out past times if the selected date is today
    const getDisabledTime = (timeStr) => {
        if (!isToday) return false;

        const [hours, minutes] = timeStr.split(':').map(Number);
        const timeToCheck = moment().set({
            hours,
            minutes,
            seconds: 0,
            milliseconds: 0
        });

        return timeToCheck.isBefore(now);
    };

    return (
        <Select
            showSearch
            value={displayValue}
            onChange={(timeString) => {
                // Simply pass the time string to the parent
                onChange(timeString);
            }}
            className={`${className} time-select`}
            placeholder="Select time"
            optionFilterProp="children"
            filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            style={{ width: '100%' }}
        >
            {generateTimeOptions().map(time => (
                <Option
                    key={time}
                    value={time}
                    disabled={getDisabledTime(time)}
                >
                    {time}
                </Option>
            ))}
        </Select>
    );
};

export default TimeSelect;