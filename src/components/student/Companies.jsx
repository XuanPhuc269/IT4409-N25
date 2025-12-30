import React from "react";
import hust_logo from "../../assets/hust_logo.png";
import microsoft_logo from "../../assets/microsoft_logo.svg";
import paypal_logo from "../../assets/paypal_logo.svg";
import walmart_logo from "../../assets/walmart_logo.svg";
import accenture_logo from "../../assets/accenture_logo.svg";
import adobe_logo from "../../assets/adobe_logo.svg";
import "./Companies.css";

const Companies = () => {
  const logos = [
    { src: hust_logo, alt: "Hust" },
    { src: microsoft_logo, alt: "Microsoft" },
    { src: paypal_logo, alt: "Paypal" },
    { src: walmart_logo, alt: "Walmart" },
    { src: accenture_logo, alt: "Accenture" },
    { src: adobe_logo, alt: "Adobe" },
  ];
  const extendedLogos = [...logos, ...logos];
  return (
    <div className="pt-16 overflow-hidden">
      <p className="text-base text-gray-500 text-center mb-16">
        Trusted by learners from
      </p>
      <div className="logos-slider">
        <div className="logos-track">
          {extendedLogos.map((logo, index) => (
            <img
              key={index}
              src={logo.src}
              alt={logo.alt}
              className="w-28 md:w-40"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Companies;