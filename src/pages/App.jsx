import React from 'react';
import { LanguageProvider } from '@/components/LanguageContext';

export default function App({ children }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}