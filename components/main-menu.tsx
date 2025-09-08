'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

enum MenuState {
  CLOSED,
  OPEN,
  BACK,
  EXITING,
}

// CSS animation class mappings for menu states
const getMenuAnimationClasses = (currentState: MenuState, isTopBar: boolean) => {
  const baseClasses = "absolute left-0 h-[2px] bg-brutalist-black origin-center transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]";
  
  if (isTopBar) {
    switch (currentState) {
      case MenuState.OPEN:
        return `${baseClasses} top-[4px] w-4 rotate-45 translate-y-1`;
      case MenuState.BACK:
        return `${baseClasses} top-[4px] w-[10px] rotate-45 translate-y-[7px]`;
      case MenuState.EXITING:
        return `${baseClasses} top-[4px] w-4 rotate-0 translate-y-0`;
      default:
        return `${baseClasses} top-[4px] w-4 rotate-0 translate-y-0`;
    }
  } else {
    switch (currentState) {
      case MenuState.OPEN:
        return `${baseClasses} top-[12px] w-4 -rotate-45 -translate-y-1`;
      case MenuState.BACK:
        return `${baseClasses} top-[12px] w-[10px] -rotate-45 -translate-y-[7px]`;
      case MenuState.EXITING:
        return `${baseClasses} top-[12px] w-4 rotate-0 translate-y-0`;
      default:
        return `${baseClasses} top-[12px] w-4 rotate-0 translate-y-0`;
    }
  }
};

interface MainMenuProps {
  isBackVisible: boolean;
  onBack: any;
  onMenuToggle?: (isOpen: boolean) => void;
}

export function MainMenu({ isBackVisible, onBack, onMenuToggle }: MainMenuProps) {
  const pathname = usePathname();
  const defaultMenuState =
    isBackVisible || pathname.startsWith('/p/')
      ? MenuState.BACK
      : MenuState.CLOSED;

  const [menuState, setMenuState] = useState<MenuState>(defaultMenuState);

  useEffect(() => {
    const newState = isBackVisible ? MenuState.BACK : MenuState.CLOSED;
    setMenuState(newState);
    onMenuToggle?.(false); // Always false since newState can only be BACK or CLOSED
  }, [isBackVisible, onMenuToggle]);

  const handleClick = () => {
    switch (menuState) {
      case MenuState.CLOSED:
        setMenuState(MenuState.OPEN);
        onMenuToggle?.(true);
        break;
      case MenuState.OPEN:
        setMenuState(MenuState.EXITING);
        onMenuToggle?.(false);
        // Wait for exit animation to complete before hiding
        setTimeout(() => setMenuState(MenuState.CLOSED), 150);
        break;
      case MenuState.BACK:
        onBack();
        break;
    }
  };

  return (
    <div className="relative flex items-center">
      <button
        className="p-2 z-20 relative size-12 flex items-center justify-center focus-interactive rounded-none"
        onClick={handleClick}
        aria-expanded={menuState === MenuState.OPEN}
        aria-label={menuState === MenuState.BACK ? 'Back' : 'Menu'}
      >
        <span className="sr-only">
          {menuState === MenuState.BACK ? 'Back' : 'Menu'}
        </span>

        <div className="size-4 relative flex items-center justify-center">
          {/* Morphing icon container */}
          <div className="relative w-4 h-4">
            {/* Solid green square - morphs into other shapes */}
            <div 
              className={`absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] rounded-tr-[3px] rounded-br-[3px] ${
                menuState === MenuState.CLOSED 
                  ? 'bg-[#00b140] scale-100 opacity-100' 
                  : 'bg-transparent scale-0 opacity-0'
              }`}
              style={{ backgroundColor: menuState === MenuState.CLOSED ? '#00b140' : 'transparent' }}
            />
            
            {/* Hamburger/X lines - morphs from square */}
            <div className={`absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
              menuState === MenuState.CLOSED 
                ? 'scale-0 opacity-0' 
                : 'scale-100 opacity-100'
            }`}>
              {/* Top line */}
              <span className={getMenuAnimationClasses(menuState, true)} />
              {/* Bottom line */}
              <span className={getMenuAnimationClasses(menuState, false)} />
            </div>
          </div>
        </div>
      </button>

      {(menuState === MenuState.OPEN || menuState === MenuState.EXITING) && (
        <nav
          id="main-menu"
          className={`absolute left-16 top-[20%] -translate-y-1/2 max-w-[calc(100vw-8rem)] ${
            menuState === MenuState.OPEN 
              ? 'animate-[slideInLeft_200ms_ease-out_forwards]' 
              : 'animate-[slideOutLeft_200ms_ease-in_forwards]'
          }`}
        >
          <ul className="flex items-center space-x-2">
            {['TRACKING', 'EVENTS'].map((item, index) => (
              <li
                key={item}
                className={`bg-brutalist-white px-3 py-1 rounded-none ${
                  menuState === MenuState.OPEN 
                    ? 'animate-[slideInLeft_200ms_ease-out_forwards]' 
                    : 'animate-[slideOutLeft_200ms_ease-in_forwards]'
                }`}
                style={{
                  animationDelay: menuState === MenuState.OPEN 
                    ? `${index * 50}ms` 
                    : `${(1 - index) * 25}ms`
                }}
              >
                <Link
                  href={`/${item.toLowerCase()}`}
                  className="text-sm font-mono hover:opacity-70 transition-opacity whitespace-nowrap focus-interactive rounded-none px-1 py-0.5"
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