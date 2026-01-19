import React from 'react';
import { Phone, Bot } from 'lucide-react';

const CallActionButton = ({ onOpenChat }) => {
  const phoneNumber = "+91 63829 28973";

  return (
    <div
      className="
        fixed z-[9999]
        
        /* Position slightly lower than center */
        right-0 top-2/3 -translate-y-1/2
        
        /* For desktop: same position */
        md:right-0 md:top-2/3 md:-translate-y-1/2
      "
    >
      {/* DOCK */}
      <div
        className="
          group flex flex-col items-center
          bg-white/40 dark:bg-zinc-950/50 backdrop-blur-2xl
          border border-white/30 dark:border-white/10
          shadow-[0_12px_40px_rgba(0,0,0,0.15)]
          
          p-2 gap-2
          rounded-l-[2rem] rounded-r-none
          
          transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
          translate-x-[calc(100%-56px)] hover:translate-x-0
          
          /* Adjust for smaller mobile screens */
          max-sm:translate-x-[calc(100%-48px)]
        "
      >
        {/* CHAT */}
        <button
          onClick={onOpenChat}
          className="flex items-center gap-3 p-1 rounded-full group/btn"
        >
          <div
            className="
              flex items-center justify-center
              w-11 h-11 md:w-12 md:h-12
              rounded-full
              bg-zinc-900 dark:bg-white
              text-white dark:text-black
              shadow-lg
              transition-transform duration-300 group-hover/btn:scale-105
              max-sm:w-10 max-sm:h-10
            "
          >
            <Bot className="w-5 h-5 max-sm:w-4 max-sm:h-4" />
          </div>

          {/* Label - Show on hover for desktop */}
          <div
            className="
              hidden md:flex flex-col
              overflow-hidden max-w-0
              group-hover:max-w-[130px]
              transition-all duration-500 delay-150
            "
          >
            <span className="text-[10px] tracking-widest font-semibold text-zinc-200 uppercase">
              Assistant
            </span>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Start Chat
            </span>
          </div>
        </button>

        {/* Divider */}
        <div className="w-8 h-px bg-zinc-300/60 dark:bg-zinc-800/60" />

        {/* CALL */}
        <a
          href={`tel:${phoneNumber}`}
          className="flex items-center gap-3 p-1 rounded-full group/btn"
        >
          <div
            className="
              relative flex items-center justify-center
              w-11 h-11 md:w-12 md:h-12
              rounded-full
              bg-gradient-to-tr from-emerald-500 to-teal-400
              text-white
              shadow-[0_8px_20px_rgba(16,185,129,0.35)]
              transition-transform duration-300 group-hover/btn:scale-105
              max-sm:w-10 max-sm:h-10
            "
          >
            <Phone className="w-5 h-5 max-sm:w-4 max-sm:h-4" />
          </div>

          {/* Label - Show on hover for desktop */}
          <div
            className="
              hidden md:flex flex-col
              overflow-hidden max-w-0
              group-hover:max-w-[130px]
              transition-all duration-500 delay-150
            "
          >
            <span className="text-[10px] tracking-widest font-semibold text-zinc-200 uppercase">
              Support
            </span>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 uppercase">
              Call Now
            </span>
          </div>
        </a>
      </div>
    </div>
  );
};

export default CallActionButton;