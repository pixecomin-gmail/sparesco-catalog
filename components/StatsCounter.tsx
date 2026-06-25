"use client";

import { useEffect, useState } from "react";

type CounterProps = {
  end: number;
  suffix?: string;
};

function Counter({ end, suffix = "" }: CounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const increment = end / totalSteps;

    const timer = setInterval(() => {
      start += increment;

      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [end]);

  return (
    <>
      {count.toLocaleString()}
      {suffix}
    </>
  );
}

export default function StatsCounter() {
  return (
    <section className="stats-strip">
      <div className="container stats-inner">
        <div>
          <strong>
            <Counter end={100000} suffix="+" />
          </strong>
          <span>Parts listed</span>
        </div>

        <div>
          <strong>
            <Counter end={200} suffix="+" />
          </strong>
          <span>Brands covered</span>
        </div>

        <div>
          <strong>
            <Counter end={50} suffix="+" />
          </strong>
          <span>Machine types</span>
        </div>

        <div>
          <strong>
            <Counter end={40} suffix="+" />
          </strong>
          <span>Years industry exp.</span>
        </div>
      </div>
    </section>
  );
}