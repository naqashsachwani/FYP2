import Link from 'next/link';
import { ArrowRight, Target } from 'lucide-react';

const CallToAction = () => {
    return (
        <div className="px-4 my-16 sm:my-20 lg:my-36 flex justify-center w-full">
            {/* Main Gradient Container */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl sm:rounded-3xl p-6 sm:p-12 lg:p-16 max-w-5xl w-full text-center shadow-xl relative overflow-hidden">
                
                {/* Decorative Background Glows */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-64 h-64 sm:w-96 sm:h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 sm:w-96 sm:h-96 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    {/* Icon */}
                    <div className="bg-white/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl inline-block mb-5 sm:mb-6 backdrop-blur-sm border border-white/20 shadow-sm">
                        <Target className="text-white w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                    </div>
                    
                    {/* Text Content */}
                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight leading-tight">
                        Ready to fund your next dream?
                    </h2>
                    <p className="text-green-50 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 opacity-90">
                        Stop waiting and start saving. Lock in today's price and pay at your own pace with our secure, zero-interest layaway plans.
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full sm:w-auto">
                        <Link 
                            href="/shop" 
                            className="bg-white text-green-700 font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl hover:bg-green-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                            Start Your Goal <ArrowRight size={18} className="sm:w-[20px] sm:h-[20px] shrink-0" />
                        </Link>
                        
                        <Link 
                            href="/create-store" 
                            className="bg-green-600/50 backdrop-blur-md border border-green-400 text-white font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl hover:bg-green-500/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center text-sm sm:text-base"
                        >
                            Become a Seller
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallToAction;