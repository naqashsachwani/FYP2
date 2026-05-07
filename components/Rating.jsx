import { Star } from "lucide-react"; // Star icon from lucide-react
import React from "react";

// Rating component: displays 5 stars with a given rating value
// Props:
// - value: number from 0 to 5 indicating how many stars are filled (default 4)
const Rating = ({ value = 4 }) => {

    return (
        // Container: flex row with vertically centered stars
        <div className="flex items-center gap-0.5">
            {/* Create 5 stars */}
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i} // Unique key for each star
                    className={`
                        shrink-0            // Prevent star from shrinking in flex container
                        w-3.5 h-3.5 sm:w-4 sm:h-4 // Responsive sizing (slightly smaller on mobile)
                        fill-current        // Fill color controlled by text color
                        ${value > i ? "text-green-400" : "text-gray-300"} // Filled vs empty star
                    `}
                />
            ))}
        </div>
    );
};

export default Rating;