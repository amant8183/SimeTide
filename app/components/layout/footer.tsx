import React from 'react';
import Link from 'next/link';

const Footer = () => {
    // Get current year for copyright
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-black/25 backdrop-blur-sm border-t-4 border-t-bgPanel shadow shadow-bginput mt-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-24 py-3">
                <div className="flex flex-row justify-between items-center space-y-4 md:space-y-0 text-txtPrimary">
                        <span className='text-txtPrimary text-[10px] sm:text-xs md:text-sm'>{currentYear} © SimeTide</span>
                        <div className='text-txtPrimary text-[8px] sm:text-xs md:text-sm flex flex-row xs:gap-2 sm:gap-4'>
                            <Link href="#" className=" hover:text-accent-primary transition-colors text-sm">
                                Order Simulator
                            </Link>

                            <Link href="#" className=" hover:text-accent-primary transition-colors text-sm">
                                Market Depth
                            </Link>


                            <Link href="#" className=" hover:text-accent-primary transition-colors text-sm">
                                Impact Analysis
                            </Link>

                            <Link href="#" className=" hover:text-accent-primary transition-colors text-sm">
                                Real-time Data
                            </Link>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center space-x-2 text-[10px] sm:text-xs md::text-sm text-txtPrimary">
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-status-positive rounded-full mr-1 animate-pulse"></div>
                                <span>Live</span>
                            </div>
                        </div>
                    


                </div>
            </div>
        </footer>
    );
};

export default Footer;