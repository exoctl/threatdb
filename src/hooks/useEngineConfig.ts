import { useState, useEffect } from 'react';
import { EngineConfig } from '@/types/api';

const DEFAULT_CONFIG: EngineConfig = {
  host: '127.0.0.1',
  port: '8081',
  baseUrl: 'http://127.0.0.1:8081'
};

export function useEngineConfig() {
  const [config, setConfig] = useState<EngineConfig>(() => {
    const saved = localStorage.getItem('engine-config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const updateConfig = (newConfig: Partial<EngineConfig>) => {
    const updated = { 
      ...config, 
      ...newConfig,
      baseUrl: `http://${newConfig.host || config.host}:${newConfig.port || config.port}`
    };
    setConfig(updated);
    localStorage.setItem('engine-config', JSON.stringify(updated));
  };

  useEffect(() => {
    localStorage.setItem('engine-config', JSON.stringify(config));
  }, [config]);

  return { config, updateConfig };
}