import React, { useState, useEffect } from 'react';
import { Form, DatePicker } from 'antd';
import moment from 'moment';

const DateTimeSelector = ({ onDateTimeChange, initialDateTime = null }) => {
    const [selectedDate, setSelectedDate] = useState(initialDateTime ? moment(initialDateTime) : null);
    const [selectedTime, setSelectedTime] = useState(initialDateTime ? moment(initialDateTime) : null);

    // Update local state when initialDateTime changes
    useEffect(() => {
        if (initialDateTime) {
            const dateTime = moment(initialDateTime);
            setSelectedDate(dateTime);
            setSelectedTime(dateTime);
        }
    }, [initialDateTime]);

    // Handle date change
    const handleDateChange = (date) => {
        setSelectedDate(date);
        if (date && selectedTime) {
            const newDateTime = date.clone()
                .set({
                    hour: selectedTime.hour(),
                    minute: selectedTime.minute(),
                    second: 0
                });
            onDateTimeChange(newDateTime);
        }
    };

    const handleTimeChange = (time) => {
        setSelectedTime(time);
        if (selectedDate && time) {
            const newDateTime = selectedDate.clone()
                .set({
                    hour: time.hour(),
                    minute: time.minute(),
                    second: 0
                });
            onDateTimeChange(newDateTime);
        }
    };

    // Get disabled times for the selected date
    const getDisabledTime = (current) => {
        if (selectedDate?.isSame(moment(), 'day')) {
            const now = moment();
            return {
                disabledHours: () => Array.from({ length: now.hour() }, (_, i) => i),
                disabledMinutes: (selectedHour) => {
                    if (selectedHour === now.hour()) {
                        return Array.from({ length: now.minute() + 5 }, (_, i) => i);
                    }
                    return [];
                }
            };
        }
        return {};
    };

    return (
        <div className="space-y-4">
            <Form.Item
                label="Departure Date"
                required
                className="mb-4"
            >
                <DatePicker
                    format="YYYY-MM-DD"
                    className="w-full"
                    value={selectedDate}
                    onChange={handleDateChange}
                    disabledDate={(current) => {
                        // Disable dates before today
                        return current && current < moment().startOf('day');
                    }}
                    placeholder="Select departure date"
                />
            </Form.Item>

            <Form.Item
                label="Departure Time"
                required
                className="mb-4"
            >
                <DatePicker
                    picker="time"
                    format="HH:mm"
                    className="w-full"
                    value={selectedTime}
                    onChange={handleTimeChange}
                    disabledTime={getDisabledTime}
                    placeholder="Select departure time"
                />
            </Form.Item>
        </div>
    );
};

export default DateTimeSelector;