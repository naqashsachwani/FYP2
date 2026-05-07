"use client"; // Marks this component as a client-side React component in Next.js

import { Bar } from "react-chartjs-2"; // Import Bar chart component from react-chartjs-2
import "chart.js/auto"; // Automatically registers Chart.js components

// ProgressChart component receives a 'goals' prop
export default function ProgressChart({ goals }) {
  // If there are no goals, show a fallback message
  if (!goals || goals.length === 0) return <p className="text-sm text-slate-500 py-4">No goals to display</p>;

  // Extract labels for the x-axis: product names
  const labels = goals.map(g => {
     const name = g.product?.name || "Unknown Product";
     // Truncate long names on chart x-axis so it doesn't break mobile view
     return name.length > 15 ? name.substring(0, 15) + '...' : name;
  });

  // Prepare the chart data
  const data = {
    labels, // x-axis labels
    datasets: [
      {
        label: "Target Amount", // Dataset label for the legend
        data: goals.map(g => Number(g.targetAmount)), // Convert targetAmount to number
        backgroundColor: "rgba(200,200,200,0.5)", // Grey semi-transparent bars
        borderRadius: 4, // Make bars look slightly modern
      },
      {
        label: "Saved", // Dataset label for saved amount
        data: goals.map(g => Number(g.saved)), // Convert saved amount to number
        backgroundColor: "rgba(34, 197, 94, 0.8)", // Tailwind green-500 equivalent bars for saved progress
        borderRadius: 4,
      },
    ],
  };

  // Chart configuration options
  const options = {
    responsive: true, // Make chart responsive
    maintainAspectRatio: false, // Allows the chart to fill the custom container height
    plugins: {
      legend: { 
          position: "top",
          labels: {
              boxWidth: 12, // Smaller legend boxes for mobile
              font: { size: 11 }
          }
      }, 
      title: { 
          display: true, 
          text: "Goal Progress",
          font: { size: 14 }
      }, 
    },
    scales: {
      x: { 
          title: { display: false, text: "Products" },
          ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 } // Rotate labels to fit
      }, 
      y: { 
        title: { display: false, text: "Amount" }, 
        beginAtZero: true, 
        ticks: { font: { size: 10 } }
      },
    },
  };

  // Render the Bar chart wrapped in a responsive container
  return (
      <div className="w-full h-64 sm:h-80 lg:h-96 relative">
        <Bar data={data} options={options} />
      </div>
  );
}