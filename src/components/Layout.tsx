import React from 'react';
import { FileText } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">BACT</h1>
                <p className="text-xs text-slate-500">Base de Arquivos para Certidões e Tradução</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {title && (
          <div className="mb-8">
            <h2 className="text-2xl font-light text-slate-900">{title}</h2>
            <div className="mt-2 h-px bg-gradient-to-r from-blue-600 to-transparent w-24"></div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}