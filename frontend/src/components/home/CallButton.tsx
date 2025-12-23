import React from 'react';
import { Phone, Bot, ChevronLeft } from 'lucide-react';

const CallActionButton = ({ onOpenChat }) => {
  const phoneNumber = "+91 63829 28973";

  return (
    <div
      className="
        fixed z-[9999]

        /* Desktop */
        md:right-0 md:-translate-y-1/2
        md:left-auto md:translate-x-0
translate-y-1/2
        /* Mobile */
        right-4 bottom-12 translate-y-1/2
      "
    >
      {/* DOCK */}
      <div
        className="
          group flex md:flex-col items-center
          bg-white/40 dark:bg-zinc-950/50 backdrop-blur-2xl
          border border-white/30 dark:border-white/10
          shadow-[0_12px_40px_rgba(0,0,0,0.15)]
          
          p-2 gap-2
          rounded-full md:rounded-l-[2rem] md:rounded-r-none
          
          transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
          md:translate-x-[calc(100%-56px)] hover:translate-x-0
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
              w-11 h-11 md:w-13 md:h-13
              rounded-full
              bg-zinc-900 dark:bg-white
              text-white dark:text-black
              shadow-lg
              transition-transform duration-300 group-hover/btn:scale-105
            "
          >
            <Bot className="w-5 h-5" />
          </div>

          {/* Label */}
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
        <div className="w-px h-8 md:w-8 md:h-px bg-zinc-300/60 dark:bg-zinc-800/60" />

        {/* CALL */}
        <a
          href={`tel:${phoneNumber}`}
          className="flex items-center gap-3 p-1 rounded-full group/btn"
        >
          <div
            className="
              relative flex items-center justify-center
              w-11 h-11 md:w-13 md:h-13
              rounded-full
              bg-gradient-to-tr from-emerald-500 to-teal-400
              text-white
              shadow-[0_8px_20px_rgba(16,185,129,0.35)]
              transition-transform duration-300 group-hover/btn:scale-105
            "
          >
            <Phone className="w-5 h-5" />
          </div>

          {/* Label */}
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
