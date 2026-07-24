'use client';

import { useState, useEffect } from 'react';
import Chatbot from './Chatbot';

export default function ChatbotLoader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <Chatbot />;
}
