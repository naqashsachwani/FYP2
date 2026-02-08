'use client' 
// Component as a Client Component in Next.js

// Functional React component for About page
const About = () => {
  return (
    // Main container with responsive width and padding
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      
      {/* Page heading */}
      <h1 className="text-4xl font-bold text-slate-800 mb-6 text-center">
        About Digital Layaway System
      </h1>

      {/* Content section using flex column layout */}
      <div className="flex flex-col gap-6 text-slate-600 text-lg">
        
        <p>
          Our Digital Layaway System is designed to make purchasing products easier 
          and more flexible for everyone. Instead of paying the full amount upfront, 
          customers can reserve their favorite items and pay over time, conveniently 
          and securely online.
        </p>

        <p>
          This system allows users to set savings goals for products they want to buy, 
          track their progress, and make partial payments until the target amount is reached. 
          It combines the benefits of layaway programs with the convenience of digital technology.
        </p>

        <p>
          The platform is user-friendly, transparent, and fully secure. Users can monitor 
          their payment schedules, receive reminders, and claim their reserved products once 
          the goal amount is achieved.
        </p>

        <p>
          Our mission is to make shopping smarter and more accessible, helping users achieve 
          their goals while ensuring a seamless, trustworthy, and efficient experience.
        </p>

      </div>
    </div>
  )
}

// Exporting component for use in routing or imports
export default About
