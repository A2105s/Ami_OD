'use client';

import { useState, useEffect } from 'react';

export default function useTypewriter(texts: string[], speed: number = 50, delay: number = 2000) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(speed);

  useEffect(() => {
    const currentText = texts[loopNum % texts.length];
    
    const handleTyping = () => {
      setDisplayText(isDeleting 
        ? currentText.substring(0, displayText.length - 1)
        : currentText.substring(0, displayText.length + 1)
      );

      setTypingSpeed(speed);

      if (!isDeleting && displayText === currentText) {
        // Pause at end of typing
        setTimeout(() => setIsDeleting(true), delay);
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum, speed, delay, texts]);

  return displayText;
}
