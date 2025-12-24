import React, { useEffect, useState } from "react";

const Rating = ({ initialRaing, onRate }) => {
  const [rating, setRating] = useState(initialRaing || 0);

  const handleRating = (value) => {
    setRating(value);
    if (onRate) onRate(value);
  };

  useEffect(() => {
    if (initialRaing) {
      setRating(initialRaing);
    }
  }, [initialRaing]);
  return (
    <div>
      {Array.from({ length: 5 }, (_, index) => {
        const startValue = index + 1;
        return (
          <span
            key={index}
            className={`text-xl sm:text-2xl
          cursor-pointer transition-colors ${
            startValue <= rating ? "text-yellow-500" : "text-gray-400"
          }`}
            onClick={() => handleRating(startValue)}
          >
            &#9733;
          </span>
        );
      })}
    </div>
  );
};

export default Rating;
