'use client';

import { useState } from 'react';
import Link from 'next/link';

enum FooterMenuState {
  CLOSED,
  OPEN,
  EXITING,
}

// CSS animation class mappings for footer menu states
const getFooterMenuAnimationClasses = (currentState: FooterMenuState, isTopBar: boolean) => {
  const baseClasses = "absolute left-0 h-[2px] bg-brutalist-black origin-center transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]";
  
  if (isTopBar) {
    switch (currentState) {
      case FooterMenuState.OPEN:
        return `${baseClasses} top-[4px] w-4 rotate-45 translate-y-1`;
      case FooterMenuState.EXITING:
        return `${baseClasses} top-[4px] w-4 rotate-0 translate-y-0`;
      default:
        return `${baseClasses} top-[4px] w-4 rotate-0 translate-y-0`;
    }
  } else {
    switch (currentState) {
      case FooterMenuState.OPEN:
        return `${baseClasses} top-[12px] w-4 -rotate-45 -translate-y-1`;
      case FooterMenuState.EXITING:
        return `${baseClasses} top-[12px] w-4 rotate-90 translate-y-0`;
      default:
        return `${baseClasses} top-[12px] w-4 rotate-90 translate-y-0`;
    }
  }
};

export function FooterMenu() {
  const [menuState, setMenuState] = useState<FooterMenuState>(FooterMenuState.CLOSED);

  const handleClick = () => {
    if (menuState === FooterMenuState.CLOSED) {
      setMenuState(FooterMenuState.OPEN);
    } else {
      setMenuState(FooterMenuState.EXITING);
      // Wait for exit animation to complete before hiding
      setTimeout(() => setMenuState(FooterMenuState.CLOSED), 150);
    }
  };

  const handleItemClick = () => {
    setMenuState(FooterMenuState.EXITING);
    setTimeout(() => setMenuState(FooterMenuState.CLOSED), 150);
  };

  return (
    <div className="relative flex items-center">
      <button
        className="p-2 z-20 relative size-12 flex items-center justify-center focus-interactive rounded-none"
        onClick={handleClick}
        aria-expanded={menuState === FooterMenuState.OPEN}
        aria-label="Footer Menu"
      >
        <span className="sr-only">Footer Menu</span>

        <div className="size-4 relative flex items-center justify-center">
          {/* Top bar */}
          <span className={getFooterMenuAnimationClasses(menuState, true)} />
          {/* Bottom bar */}
          <span className={getFooterMenuAnimationClasses(menuState, false)} />
        </div>
      </button>

      {(menuState === FooterMenuState.OPEN || menuState === FooterMenuState.EXITING) && (
        <nav
          id="footer-menu"
          className={`absolute left-1/2 bottom-[20%] translate-y-1/2 ml-8 ${
            menuState === FooterMenuState.OPEN 
              ? 'animate-[slideInLeft_200ms_ease-out_forwards]' 
              : 'animate-[slideOutLeft_200ms_ease-in_forwards]'
          }`}
        >
          <ul className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            {['HELP', 'TERMS', 'PRIVACY', 'CONTACT'].map((item, index) => (
              <li
                key={item}
                className={`bg-brutalist-white px-3 py-1 rounded-none ${
                  menuState === FooterMenuState.OPEN 
                    ? 'animate-[slideInLeft_200ms_ease-out_forwards]' 
                    : 'animate-[slideOutLeft_200ms_ease-in_forwards]'
                }`}
                style={{
                  animationDelay: menuState === FooterMenuState.OPEN 
                    ? `${index * 50}ms` 
                    : `${(3 - index) * 25}ms`
                }}
              >
                <Link
                  href={`/${item.toLowerCase()}`}
                  className="text-sm font-mono hover:opacity-70 transition-opacity whitespace-nowrap focus-interactive rounded-none px-1 py-0.5"
                  onClick={handleItemClick}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}