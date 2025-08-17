'use client';

import { useState, useEffect } from 'react';

type TypewriterTextProps = {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenTexts?: number;
  className?: string;
};

export default function TypewriterText({
  texts = ['Welcome'],
  typingSpeed = 200,    // Typing speed: 200ms per character
  deletingSpeed = 100,   // Deleting speed: 100ms per character
  delayBetweenTexts = 3000, // Pause for 3 seconds between texts
  className = ''
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingPause, setTypingPause] = useState(false);

  useEffect(() => {
    if (texts.length === 0) return;
    
    const currentText = texts[currentTextIndex % texts.length];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && !typingPause) {
      // Typing
      if (displayText.length < currentText.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentText.substring(0, displayText.length + 1));
        }, typingSpeed);
      } else {
        // Pause at the end of typing
        setTypingPause(true);
        timeout = setTimeout(() => {
          setTypingPause(false);
          setIsDeleting(true);
        }, delayBetweenTexts);
      }
    } else if (isDeleting) {
      // Deleting
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.substring(0, displayText.length - 1));
        }, deletingSpeed);
      } else {
        // Move to next text
        setIsDeleting(false);
        setCurrentTextIndex((currentTextIndex + 1) % texts.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, currentTextIndex, isDeleting, typingPause, texts, typingSpeed, deletingSpeed, delayBetweenTexts]);

  return (
    <span className={`relative ${className}`}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
}
