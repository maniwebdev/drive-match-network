import React from 'react';
import { Form, DatePicker, InputNumber } from 'antd';
import moment from 'moment';
import TimeSelect from './TimeSelect';

// Update the Schedule step content
const ScheduleStep = ({
    selectedDate,
    selectedTime,
    handleDateChange,
    handleTimeChange,
    rideData,
    setRideData,
    styles
}) => {
    // Format the time value for the TimeSelect component
    const timeValue = selectedTime ?
        (moment.isMoment(selectedTime) ? selectedTime.format('HH:mm') : selectedTime)
        : null;

    return (
        <div className={styles.stepContent}>
            <div className={styles.datetimeContainer}>
                <Form.Item label="Departure Date" required>
                    <DatePicker
                        format="YYYY-MM-DD"
                        className={styles.dateInput}
                        value={selectedDate}
                        onChange={handleDateChange}
                        disabledDate={(current) =>
                            current && current < moment().startOf('day')
                        }
                    />
                </Form.Item>

                <Form.Item label="Departure Time" required>
                    <TimeSelect
                        value={timeValue}
                        onChange={(timeString) => {
                            // Pass the time string directly to the handler
                            handleTimeChange(timeString);
                        }}
                        className={styles.timeInput}
                        currentDate={selectedDate}
                    />
                </Form.Item>

                <Form.Item label="Estimated Duration (minutes)" required>
                    <InputNumber
                        min={1}
                        value={rideData.estimatedDuration}
                        onChange={value => setRideData(prev => ({
                            ...prev,
                            estimatedDuration: value
                        }))}
                        placeholder="Enter estimated duration"
                    />
                </Form.Item>
            </div>
        </div>
    );
};

export default ScheduleStep;