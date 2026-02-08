"use client"; // Marks this component as a client-side React component in Next.js

import { Bar } from "react-chartjs-2"; // Import Bar chart component from react-chartjs-2
import "chart.js/auto"; // Automatically registers Chart.js components

// ProgressChart component receives a 'goals' prop
export default function ProgressChart({ goals }) {
  // If there are no goals, show a fallback message
  if (!goals || goals.length === 0) return <p>No goals to display</p>;

  // Extract labels for the x-axis: product names
  const labels = goals.map(g => g.product?.name || "Unknown Product");

  // Prepare the chart data
  const data = {
    labels, // x-axis labels
    datasets: [
      {
        label: "Target Amount", // Dataset label for the legend
        data: goals.map(g => Number(g.targetAmount)), // Convert targetAmount to number
        backgroundColor: "rgba(200,200,200,0.5)", // Grey semi-transparent bars
      },
      {
        label: "Saved", // Dataset label for saved amount
        data: goals.map(g => Number(g.saved)), // Convert saved amount to number
        backgroundColor: "rgba(100,200,100,0.8)", // Green bars for saved progress
      },
    ],
  };

  // Chart configuration options
  const options = {
    responsive: true, // Make chart responsive
    plugins: {
      legend: { position: "top" }, // Position of the legend
      title: { display: true, text: "Goal Progress" }, // Chart title
    },
    scales: {
      x: { title: { display: true, text: "Products" } }, // X-axis label
      y: { 
        title: { display: true, text: "Amount" }, // Y-axis label
        beginAtZero: true, // Start Y-axis from 0
      },
    },
  };

  // Render the Bar chart with data and options
  return <Bar data={data} options={options} />;
}
