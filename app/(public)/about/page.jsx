'use client' 
// Component as a Client Component in Next.js

// Functional React component for About page
const About = () => {
  return (
    // Main container with responsive width, padding, and flex layout to ensure footer stays down
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-12 lg:p-16">
          {/* Page heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 sm:mb-12 text-center tracking-tight leading-tight">
            About <span className="text-emerald-600">Digital Layaway</span> System
          </h1>

          {/* Content section using flex column layout */}
          <div className="flex flex-col gap-6 sm:gap-8 text-slate-600 text-base sm:text-lg lg:text-xl leading-relaxed font-medium">
            
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
    </div>
  )
}

// Exporting component for use in routing or imports
export default About