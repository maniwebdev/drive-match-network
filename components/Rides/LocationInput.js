// components/Rides/LocationInput.js
import React, { useState } from 'react';
import { Input, Dropdown } from 'antd';
import { MapPin } from 'lucide-react';
import styles from '../../styles/Rides/LocationInput.module.css';

const LocationInput = ({ value, onChange, placeholder }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const searchLocation = async (searchText) => {
        if (searchText.length < 3) return;

        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}`
            );
            const data = await response.json();

            const formattedSuggestions = data.map(item => ({
                address: item.display_name,
                city: extractCity(item),
                coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
            }));

            setSuggestions(formattedSuggestions);
        } catch (error) {
            console.error('Location search error:', error);
        }
        setLoading(false);
    };

    const extractCity = (item) => {
        const addressParts = item.display_name.split(', ');
        // Usually the city is the second-to-last or third-to-last part
        return addressParts[addressParts.length - 3] || addressParts[addressParts.length - 2];
    };

    const handleSelect = (suggestion) => {
        onChange(suggestion);
        setSuggestions([]);
    };

    const items = suggestions.map((suggestion, index) => ({
        key: index,
        label: (
            <div
                className={styles.suggestionItem}
                onClick={() => handleSelect(suggestion)}
            >
                <MapPin className={styles.suggestionIcon} />
                <div>
                    <div className={styles.suggestionAddress}>{suggestion.address}</div>
                    <div className={styles.suggestionCity}>{suggestion.city}</div>
                </div>
            </div>
        ),
    }));

    return (
        <Dropdown
            menu={{ items }}
            open={suggestions.length > 0}
            onOpenChange={(open) => !open && setSuggestions([])}
        >
            <Input
                prefix={<MapPin className={styles.inputIcon} />}
                placeholder={placeholder}
                className={styles.input}
                value={value.address}
                onChange={(e) => {
                    onChange({ ...value, address: e.target.value });
                    searchLocation(e.target.value);
                }}
                loading={loading}
            />
        </Dropdown>
    );
};

export default LocationInput;