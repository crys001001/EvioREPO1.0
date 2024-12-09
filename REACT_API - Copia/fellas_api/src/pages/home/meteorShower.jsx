import React from 'react';
import './MeteorShower.css';

const MeteorShower = () => {
  const meteors = Array.from({ length: 10 });

  return (
    <div className="meteor-shower">
      {meteors.map((_, index) => (
        <div key={index} className="meteor"></div>
      ))}
    </div>
  );
};

export default MeteorShower;
