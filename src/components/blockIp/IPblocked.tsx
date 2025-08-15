import React, { useState, useEffect } from 'react';
import { Shield, ShieldX, AlertTriangle, Lock, Eye, EyeOff, Wifi, WifiOff, Globe, Ban, Clock, RefreshCw } from 'lucide-react';

interface IPBlockedScreenProps {
  blockedIP?: string;
  reason?: string;
  contactEmail?: string;
}

export default function IPBlockedScreen({ 
  blockedIP, 
  reason = "Múltiplas tentativas de acesso não autorizado",
  contactEmail = "suporte@bact.com.br"
}: IPBlockedScreenProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pulseCount, setPulseCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const pulseTimer = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(pulseTimer);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-red-400 rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div
                key={i}
                className="border border-red-400 animate-pulse"
                style={{
                  animationDelay: `${(i * 0.1) % 3}s`,
                  animationDuration: '3s'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-red-200 p-12 text-center animate-slideUp">
          {/* Animated shield icon */}
          <div className="relative mb-8">
            <div className="relative inline-block">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 w-32 h-32 border-4 border-red-500 rounded-full animate-spin opacity-30" 
                   style={{ animationDuration: '3s' }} />
              
              {/* Middle pulsing ring */}
              <div className="absolute inset-2 w-28 h-28 border-2 border-red-400 rounded-full animate-ping opacity-40" />
              
              {/* Inner shield container */}
              <div className="relative w-32 h-32 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-500">
                {/* Animated shield icon */}
                <div className="relative">
                  <ShieldX 
                    className={`w-16 h-16 text-white transform transition-all duration-1000 ${
                      pulseCount % 2 === 0 ? 'scale-100 rotate-0' : 'scale-110 rotate-12'
                    }`} 
                  />
                  
                  {/* Glowing effect */}
                  <div className="absolute inset-0 w-16 h-16 bg-red-300 rounded-full blur-xl opacity-50 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Title with typewriter effect */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-red-600 mb-2 animate-slideIn">
              ACESSO BLOQUEADO
            </h1>
            <div className="flex items-center justify-center space-x-2 text-red-500">
              <span className="text-lg font-semibold">IP Restrito</span>
            </div>
          </div>

          {/* IP Address display */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="relative">
                <Globe className="w-8 h-8 text-red-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">Endereço IP Bloqueado</p>
                <p className="text-2xl font-bold text-red-800 font-mono tracking-wider">
                  {blockedIP || 'IP não detectado'}
                </p>
              </div>
            </div>
            
            {/* Animated bars */}
            <div className="flex justify-center space-x-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-red-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 20 + 10}px`,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 animate-bounce" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-red-800 mb-2">Motivo do Bloqueio:</h3>
                <p className="text-red-700">{reason}</p>
              </div>
            </div>
          </div>

          {/* Time display */}
          <div className="flex items-center justify-center space-x-4 mb-8 text-slate-600">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '60s' }} />
              <span className="font-mono text-lg">{formatTime(currentTime)}</span>
            </div>
            <div className="w-px h-6 bg-slate-300" />
            <div className="flex items-center space-x-2">
              <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-sm">Conexão Negada</span>
            </div>
          </div>

          {/* Details toggle */}
          <div className="mb-8">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-center space-x-2 mx-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes Técnicos'}
              </span>
            </button>

            {/* Animated details panel */}
            <div className={`mt-4 overflow-hidden transition-all duration-500 ${
              showDetails ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="bg-slate-50 rounded-xl p-6 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Timestamp:</span>
                    <p className="font-mono text-slate-600">{currentTime.toISOString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Código de Erro:</span>
                    <p className="font-mono text-red-600">ERR_IP_BLOCKED_403</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Servidor:</span>
                    <p className="font-mono text-slate-600">BACT-SEC-01</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Região:</span>
                    <p className="font-mono text-slate-600">BR-SP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}