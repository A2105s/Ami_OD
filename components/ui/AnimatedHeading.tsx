"use client";

import { useEffect, useState, useCallback } from "react";

interface AnimatedHeadingProps {
  className?: string;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
}

const AnimatedHeading = ({
  className = "",
  textSize = 'lg'
}: AnimatedHeadingProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150); // Initial typing speed increased from 100ms to 150ms
  
  const words = ["Portal", "Hub", "System"];
  const staticText = "OD Mail Automation ";

  const textSizes = {
    sm: 'text-2xl',
    md: 'text-3xl md:text-4xl',
    lg: 'text-4xl md:text-5xl',
    xl: 'text-5xl md:text-6xl'
  };

  const handleTyping = useCallback(() => {
    const currentWord = words[currentWordIndex];
    
    if (isDeleting) {
      setDisplayText(prev => {
        const newText = prev.substring(0, prev.length - 1);
        if (newText === '') {
          setIsDeleting(false);
          setCurrentWordIndex(prev => (prev + 1) % words.length);
          setTypingSpeed(40); // Reset typing speed increased from 100ms to 150ms
        }
        return newText;
      });
      setTypingSpeed(40);
    } else {
      setDisplayText(currentWord.substring(0, displayText.length + 1));
      if (displayText === currentWord) {
        setTypingSpeed(1000); // Pause before deleting increased from 500ms to 1000ms
        setTimeout(() => setIsDeleting(true), 1500); // Pause duration increased from 800ms to 1500ms
      } else {
        setTypingSpeed(Math.random() * 60 + 60); // Random typing speed range increased from 30-60ms to 60-120ms
      }
    }
  }, [currentWordIndex, displayText, isDeleting]);

  useEffect(() => {
    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [handleTyping, typingSpeed]);

  // Reset animation when words change
  useEffect(() => {
    setDisplayText('');
    setIsDeleting(false);
  }, [words.join()]);

  return (
    <div className={`${className} text-center`}>
      <h1 className={`${textSizes[textSize]} font-bold text-white flex items-center justify-center`}>
        <span className="whitespace-nowrap">{staticText}</span>
        <span className="relative inline-flex items-baseline">
          <span 
            className="text-[#f1c012] inline-block min-w-[60px] text-left align-middle"
            style={{
              borderRight: '0.15em solid #f1c012',
              paddingRight: '4px',
              animation: 'blink 0.7s step-end infinite',
              height: '1em',
              lineHeight: '1em',
              display: 'inline-block',
              verticalAlign: 'middle',
              marginLeft: '0.25em'
            }}
          >
            {displayText}
          </span>
          <style jsx global>{`
            @keyframes blink {
              from, to { border-color: transparent; }
              50% { border-color: #f1c012; }
            }
          `}</style>
        </span>
      </h1>
    </div>
  );
};

export default AnimatedHeading;
