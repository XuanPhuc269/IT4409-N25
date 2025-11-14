import React from "react";
import Hero from "../../components/student/Hero";
import TestimonialsSection from "../../components/student/TestimonialsSection";

const Home = () => {
  return (
    <div className="flex flex-col items-center space-y-7 text-center">
      <Hero />
      <TestimonialsSection />
    </div>
  );
};

export default Home;
