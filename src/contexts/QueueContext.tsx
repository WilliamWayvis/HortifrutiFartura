import React, { createContext, useContext, useState, useEffect } from 'react';

interface QueueItem {
  id: string;
  code: string;
  type: 'frangos' | 'carnes';
  priority: boolean;
  timestamp: number;
  calledAt?: number;
}

interface QueueContextType {
  queue: QueueItem[];
  current: QueueItem | null;
  calledHistory: QueueItem[];
  normalCallsSincePriority: { frangos: number; carnes: number };
  marqueeMessage: string;
  marqueeSpeed: number;
  marqueeBgColor: string;
  marqueeFontColor: string;
  marqueeFont: string;
  marqueeFontSize: number;
  addToQueue: (item: Omit<QueueItem, 'id' | 'timestamp'>) => Promise<void>;
  callNext: () => Promise<void>;
  callNextFrangos: () => Promise<void>;
  callNextCarnes: () => Promise<void>;
  resetQueue: () => Promise<void>;
  setMarqueeMessage: (message: string, speed?: number, bgColor?: string, fontColor?: string, font?: string, fontSize?: number) => Promise<void>;
  getNextNumber: (type: 'frangos' | 'carnes') => Promise<string>;
  getAverageWaitTime: (type: 'frangos' | 'carnes') => number;
  getNextToCall: (type: 'frangos' | 'carnes') => QueueItem | null;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [current, setCurrent] = useState<QueueItem | null>(null);
  const [calledHistory, setCalledHistory] = useState<QueueItem[]>([]);
  const [counters, setCounters] = useState<{ frangos: number; carnes: number }>({
    frangos: 1,
    carnes: 1,
  });
  const [normalCallsSincePriority, setNormalCallsSincePriority] = useState<{ frangos: number; carnes: number }>({
    frangos: 0,
    carnes: 0,
  });
  const [marqueeMessage, setMarqueeMessageState] = useState<string>('');
  const [marqueeSpeed, setMarqueeSpeed] = useState<number>(1);
  const [marqueeBgColor, setMarqueeBgColor] = useState<string>('#000000');
  const [marqueeFontColor, setMarqueeFontColor] = useState<string>('#ffffff');
  const [marqueeFont, setMarqueeFont] = useState<string>('sans-serif');
  const [marqueeFontSize, setMarqueeFontSize] = useState<number>(24);

  // bootstrap from server state and subscribe to updates
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL ?? '';
    fetch(`${base}/state`)
      .then(res => res.json())
      .then(s => {
        setQueue(s.queue);
        setCurrent(s.current);
        setCalledHistory(s.history || []);
        setCounters(s.counters || counters);
        setNormalCallsSincePriority(s.normalCallsSincePriority || { frangos: 0, carnes: 0 });
        setMarqueeMessageState(s.marqueeMessage || '');
        setMarqueeSpeed(
          typeof s.marqueeSpeed === 'number' && s.marqueeSpeed >= 1 && s.marqueeSpeed <= 4
            ? s.marqueeSpeed
            : 1
        );
        if (s.marqueeBgColor) setMarqueeBgColor(s.marqueeBgColor);
        if (s.marqueeFontColor) setMarqueeFontColor(s.marqueeFontColor);
        if (s.marqueeFont) setMarqueeFont(s.marqueeFont);
        if (typeof s.marqueeFontSize === 'number') setMarqueeFontSize(s.marqueeFontSize);
      });

    const es = new EventSource(`${base}/events`);

    es.onmessage = e => {
      const s = JSON.parse(e.data);
      setQueue(s.queue);
      setCurrent(s.current);
      setCalledHistory(s.history || []);
      setCounters(s.counters || counters);
      setNormalCallsSincePriority(s.normalCallsSincePriority || { frangos: 0, carnes: 0 });
      setMarqueeMessageState(s.marqueeMessage || '');
      setMarqueeSpeed(
        typeof s.marqueeSpeed === 'number' && s.marqueeSpeed >= 1 && s.marqueeSpeed <= 4
          ? s.marqueeSpeed
          : 1
      );
      if (s.marqueeBgColor) setMarqueeBgColor(s.marqueeBgColor);
      if (s.marqueeFontColor) setMarqueeFontColor(s.marqueeFontColor);
      if (s.marqueeFont) setMarqueeFont(s.marqueeFont);
      if (typeof s.marqueeFontSize === 'number') setMarqueeFontSize(s.marqueeFontSize);
    };
    return () => es.close();
  }, []);

  const base = import.meta.env.VITE_API_URL ?? '';

  const getNextNumber = async (type: 'frangos' | 'carnes') => {
    const res = await fetch(`${base}/next-number/${type}`, { method: 'POST' });
    const body = await res.json();
    return body.number;
  };

  const addToQueue = async (item: Omit<QueueItem, 'id' | 'timestamp'>) => {
    await fetch(`${base}/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
  };

  const callNext = async () => {
    await fetch(`${base}/call/next`, { method: 'POST' });
  };

  const callNextFrangos = async () => {
    await fetch(`${base}/call/frangos`, { method: 'POST' });
  };

  const callNextCarnes = async () => {
    await fetch(`${base}/call/carnes`, { method: 'POST' });
  };

  const resetQueue = async () => {
    await fetch(`${base}/reset`, { method: 'POST' });
  };

  const setMarqueeMessage = async (message: string, speed?: number, bgColor?: string, fontColor?: string, font?: string, fontSize?: number) => {
    const safeSpeed = typeof speed === 'number' ? Math.min(4, Math.max(1, Math.round(speed))) : undefined;
    const safeSize = typeof fontSize === 'number' ? Math.min(72, Math.max(12, Math.round(fontSize))) : undefined;
    await fetch(`${base}/marquee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, speed: safeSpeed, bgColor, fontColor, font, fontSize: safeSize }),
    });
  };

  const getAverageWaitTime = (type: 'frangos' | 'carnes') => {
    const relevantHistory = calledHistory.filter(item => item.type === type && item.calledAt);
    if (relevantHistory.length === 0) return 0;

    const totalWaitTime = relevantHistory.reduce((sum, item) => {
      return sum + (item.calledAt! - item.timestamp);
    }, 0);

    return Math.round(totalWaitTime / relevantHistory.length / 1000 / 60); // minutes
  };

  const getNextToCall = (type: 'frangos' | 'carnes') => {
    const relevantQueue = queue.filter(item => item.type === type);
    if (relevantQueue.length === 0) return null;

    const priorities = relevantQueue.filter(item => item.priority);
    const mustCallPriority = normalCallsSincePriority[type] >= 3;

    // Mesma lógica do servidor: FIFO, exceto quando 3 gerais seguidos → prioritário mais antigo vai à frente
    if (priorities.length > 0 && mustCallPriority) {
      return priorities[0];
    }

    return relevantQueue[0];
  };

  return (
    <QueueContext.Provider value={{
      queue,
      current,
      calledHistory,
      normalCallsSincePriority,
      marqueeMessage,
      marqueeSpeed,
      marqueeBgColor,
      marqueeFontColor,
      marqueeFont,
      marqueeFontSize,
      addToQueue,
      callNext,
      callNextFrangos,
      callNextCarnes,
      resetQueue,
      setMarqueeMessage,
      getNextNumber,
      getAverageWaitTime,
      getNextToCall
    }}>
      {children}
    </QueueContext.Provider>
  );
};