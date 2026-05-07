import React from 'react'
import Title from './Title'
import { ourSpecsData } from '@/assets/assets'

// OurSpecs component: displays a set of specifications/features
const OurSpecs = () => {
  return (
    // Outer container: centers content and adds responsive padding and margins
    <div className="px-4 sm:px-6 lg:px-8 my-16 sm:my-20 lg:my-24 max-w-7xl mx-auto">
      
      {/* Section title */}
      <Title
        visibleButton={false} // No extra button in this title
        title="Our Specifications" // Main heading
        description="We deliver premium-quality service and convenience — making every shopping experience smooth, secure, and stress-free." // Description
      />

      {/* Grid container for the specification cards */}
      {/* - Responsive grid: 1 column on mobile, 2 on small screens, 3 on large screens
        - Gap between grid items: gap-6 on mobile, gap-8 on larger
        - Margin-top to separate from the title: mt-12 to mt-16
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16 pt-4 sm:pt-0">
        {ourSpecsData.map((spec, index) => (
          // Individual spec card
          // - Rounded corners and shadows for a card look
          // - hover:-translate-y-2: slight lift on hover
          // - hover:shadow-2xl: prominent shadow on hover
          // - transition-transform duration-300: smooth lift effect
          <div
            key={index}
            className="relative bg-white border border-slate-200 rounded-3xl shadow-sm sm:shadow-md hover:shadow-xl sm:hover:shadow-2xl transition-transform duration-300 p-6 sm:p-8 text-center group sm:hover:-translate-y-2 mt-6 sm:mt-0"
          >
            
            {/* Icon container */}
            {/* - Positioned above the card using absolute positioning
              - Centered horizontally using left-1/2 and translate-x-1/2
              - Rounded full circle with shadow
              - Gradient background to match theme
              - Scales slightly on hover: group-hover:scale-110
              - Smooth transition on scaling
            */}
            <div
              className="absolute -top-8 left-1/2 -translate-x-1/2 w-14 h-14 flex items-center justify-center rounded-full shadow-lg text-white bg-gradient-to-r from-green-400 to-emerald-500 group-hover:scale-110 transition-transform duration-300 shrink-0"
            >
              {/* Dynamically render the icon for each spec */}
              <spec.icon size={24} />
            </div>

            {/* Spec title */}
            {/* - mt-6/mt-10 to create spacing below the icon
              - Font: semi-bold
              - Size: lg/xl
              - Text color: dark slate
            */}
            <h3 className="mt-8 sm:mt-10 font-semibold text-lg sm:text-xl text-slate-800">{spec.title}</h3>

            {/* Spec description */}
            {/* - Text color: medium slate
              - Font size: text-xs/text-sm
              - Margin top: mt-2/mt-3
              - Line height: leading-relaxed for readability
            */}
            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed">
              {spec.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OurSpecs