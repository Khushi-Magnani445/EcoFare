import React, { useRef} from "react";
import axios from "axios";



// const API_KEY = "pk.9fa8093bee5c9e1de9198189ed29f2d5";
const API_KEY = "AlzaSyA1By0php1SOlQ_WypLE7XbWDw5rOUV0QE";



function LocationSearch({ label, value, onChange,onInputClick,setSuggestions }) {
    
    // const [showDropdown, setShowDropdown] = useState(false);
    
    const debounceTimeout = useRef(null);

    const handleInputChange = (e) => {
        const inputValue = e.target.value;
        onChange(inputValue);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            if (inputValue.length < 2) {
                setSuggestions([]);
                
                return;
            }

            try {
                const res = await axios.get(
                    `https://maps.gomaps.pro/maps/api/place/queryautocomplete/json?input=${inputValue}&key=${API_KEY}`
                );
                console.log("Go Maps Pro API response:", res.data)
                setSuggestions(res.data.predictions || []);
                
            } catch {
                setSuggestions([]);
                
            }
        }, 600);
    };

    // const handleSelect = (suggestion) => {
    //     onChange(suggestion.description);
    //     setSuggestions([]);
        
    // };

    

    return (
        <div className="relative my-4">
            
        <input
            type="text"
            value={value}
            onClick={onInputClick}
            onChange={handleInputChange}
            placeholder={label}
            className="border rounded px-3 py-3 w-full outline-none"
            autoComplete="off"
        />
        {/* {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-10 bg-[#111D1B] border-[#0a100f] w-full rounded shadow">
            {suggestions.map((s, idx) => (
                <div
                key={s.place_id || idx}
                className="px-3 py-2 hover:bg-[#111D1B] text-[#00FF00] cursor-pointer"
                onClick={() => handleSelect(s)}
                >
                {s.description}
                </div>
            ))}
            </div>
        )} */}
        </div>
    );
}

export default LocationSearch;
