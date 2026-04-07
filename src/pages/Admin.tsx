import { useEffect, useState } from "react";
import { useQueue } from "@/contexts/QueueContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/fartura-logo.png";
import AdminLogin from "./AdminLogin";

interface ReportData {
  generatedAt: string;
  date: string;
  totalTickets: number;
  frangosTotal: number;
  carnesTotal: number;
  frangosPriority: number;
  carnesPriority: number;
  avgWaitFrangos: number;
  avgWaitCarnes: number;
  avgWaitTotal: number;
  peakHour: string;
  peakHourCount: number;
  hourlyData: Array<{ hour: string; count: number; avgWait: number }>;
  firstTicketTime: string | null;
  lastTicketTime: string | null;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { queue, current, callNextFrangos, callNextCarnes, addToQueue, getNextNumber, resetQueue, calledHistory, getAverageWaitTime, getNextToCall, normalCallsSincePriority, marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont, marqueeFontSize, setMarqueeMessage } = useQueue();

  const [newType, setNewType] = useState<'frangos' | 'carnes'>('frangos');
  const [newPriority, setNewPriority] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [o2Range, setO2Range] = useState<'dia' | 'mes' | 'ano'>('dia');
  const [marqueeInput, setMarqueeInput] = useState('');
  const [marqueeSpeedInput, setMarqueeSpeedInput] = useState<number>(1);
  const [marqueeBgInput, setMarqueeBgInput] = useState('#000000');
  const [marqueeFontColorInput, setMarqueeFontColorInput] = useState('#ffffff');
  const [marqueeFontInput, setMarqueeFontInput] = useState('sans-serif');
  const [marqueeFontSizeInput, setMarqueeFontSizeInput] = useState<number>(24);

  const frangosQueue = queue.filter(item => item.type === 'frangos');
  const carnesQueue = queue.filter(item => item.type === 'carnes');
  const frangosHistory = calledHistory.filter(item => item.type === 'frangos');
  const carnesHistory = calledHistory.filter(item => item.type === 'carnes');

  useEffect(() => {
    setMarqueeInput(marqueeMessage || '');
    setMarqueeSpeedInput(marqueeSpeed || 1);
    setMarqueeBgInput(marqueeBgColor || '#000000');
    setMarqueeFontColorInput(marqueeFontColor || '#ffffff');
    setMarqueeFontInput(marqueeFont || 'sans-serif');
    setMarqueeFontSizeInput(marqueeFontSize || 24);
  }, [marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont, marqueeFontSize]);

  if (!isAuthenticated) {
    return <AdminLogin onAuth={() => setIsAuthenticated(true)} />;
  }

  const generateManualTicket = async () => {
    const prefix = newType === 'frangos' ? 'F' : 'C';
    const number = await getNextNumber(newType);
    const code = `${prefix}${newPriority ? 'P' : ''}${number}`;
    await addToQueue({ code, type: newType, priority: newPriority });
    setLastGenerated(code);
    setTimeout(() => setLastGenerated(null), 3000);
  };

  const buildReport = (): ReportData => {
    const valid = calledHistory.filter(item => item.calledAt && item.calledAt >= item.timestamp);
    const frangos = valid.filter(i => i.type === 'frangos');
    const carnes = valid.filter(i => i.type === 'carnes');

    const avgMin = (items: typeof valid) => {
      if (items.length === 0) return 0;
      return items.reduce((s, i) => s + (i.calledAt! - i.timestamp), 0) / items.length / 1000 / 60;
    };

    const hourlyData = Array.from({ length: 24 }, (_, h) => {
      const hItems = valid.filter(i => new Date(i.calledAt!).getHours() === h);
      return { hour: `${h.toString().padStart(2, '0')}h`, count: hItems.length, avgWait: avgMin(hItems) };
    });

    const peakHourObj = hourlyData.reduce((a, b) => b.count > a.count ? b : a, hourlyData[0]);

    const allTs = valid.map(i => i.timestamp);
    const calledTs = valid.map(i => i.calledAt!);
    const firstTicketTime = allTs.length > 0 ? new Date(Math.min(...allTs)).toLocaleTimeString('pt-BR') : null;
    const lastTicketTime = calledTs.length > 0 ? new Date(Math.max(...calledTs)).toLocaleTimeString('pt-BR') : null;

    return {
      generatedAt: new Date().toLocaleString('pt-BR'),
      date: new Date().toLocaleDateString('pt-BR'),
      totalTickets: valid.length,
      frangosTotal: frangos.length,
      carnesTotal: carnes.length,
      frangosPriority: frangos.filter(i => i.priority).length,
      carnesPriority: carnes.filter(i => i.priority).length,
      avgWaitFrangos: avgMin(frangos),
      avgWaitCarnes: avgMin(carnes),
      avgWaitTotal: avgMin(valid),
      peakHour: peakHourObj?.hour ?? '-',
      peakHourCount: peakHourObj?.count ?? 0,
      hourlyData,
      firstTicketTime,
      lastTicketTime,
    };
  };

  const formatReportText = (r: ReportData): string => {
    const lines = [
      '═══════════════════════════════════════════════',
      '         RELATÓRIO DE EXPEDIENTE',
      '         Hortifrúti Fartura',
      '═══════════════════════════════════════════════',
      `Data: ${r.date}`,
      `Gerado em: ${r.generatedAt}`,
      '',
      '─── RESUMO GERAL ───────────────────────────────',
      `Total de senhas atendidas : ${r.totalTickets}`,
      `Frangos                   : ${r.frangosTotal} (${r.frangosPriority} prioritários)`,
      `Açougue                   : ${r.carnesTotal} (${r.carnesPriority} prioritários)`,
      '',
      `Primeiro atendimento      : ${r.firstTicketTime ?? '-'}`,
      `Último atendimento        : ${r.lastTicketTime ?? '-'}`,
      '',
      '─── TEMPO MÉDIO DE ESPERA ───────────────────────',
      `Geral    : ${r.avgWaitTotal.toFixed(1)} min`,
      `Frangos  : ${r.avgWaitFrangos.toFixed(1)} min`,
      `Açougue  : ${r.avgWaitCarnes.toFixed(1)} min`,
      '',
      '─── HORÁRIO DE PICO ─────────────────────────────',
      `Horário: ${r.peakHour}  (${r.peakHourCount} atendimentos)`,
      '',
      '─── DISTRIBUIÇÃO POR HORA ───────────────────────',
      ...r.hourlyData
        .filter(h => h.count > 0)
        .map(h => `  ${h.hour}  →  ${h.count} atendimentos  |  Espera média: ${h.avgWait.toFixed(1)} min`),
      '',
      '═══════════════════════════════════════════════',
    ];
    return lines.join('\n');
  };

  const downloadReport = async (r: ReportData) => {
    const text = formatReportText(r);
    const fileName = `relatorio-expediente-${r.date.replace(/\//g, '-')}.txt`;
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'Arquivo de Texto', accept: { 'text/plain': ['.txt'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(text);
        await writable.close();
        return;
      } catch {
        // usuário cancelou o seletor — ignora
      }
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmReset = async () => {
    const report = buildReport();
    setReportData(report);
    await resetQueue();
    setShowResetConfirm(false);
    setShowReport(true);
  };

  const saveMarqueeMessage = async () => {
    await setMarqueeMessage(marqueeInput, marqueeSpeedInput, marqueeBgInput, marqueeFontColorInput, marqueeFontInput, marqueeFontSizeInput);
  };

  const clearMarqueeMessage = async () => {
    setMarqueeInput('');
    await setMarqueeMessage('', marqueeSpeedInput, marqueeBgInput, marqueeFontColorInput, marqueeFontInput, marqueeFontSizeInput);
  };

  const sortedFrangosQueue = [...frangosQueue].sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    return a.timestamp - b.timestamp;
  });

  const sortedCarnesQueue = [...carnesQueue].sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    return a.timestamp - b.timestamp;
  });

  const validCalledHistory = calledHistory.filter(
    item => item.calledAt && item.calledAt >= item.timestamp
  );

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const todayItems = validCalledHistory.filter(item => {
    const d = new Date(item.calledAt!);
    return (
      d.getFullYear() === currentYear &&
      d.getMonth() === currentMonth &&
      d.getDate() === currentDay
    );
  });

  const monthItems = validCalledHistory.filter(item => {
    const d = new Date(item.calledAt!);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const yearItems = validCalledHistory.filter(item => {
    const d = new Date(item.calledAt!);
    return d.getFullYear() === currentYear;
  });

  const averageMinutes = (items: typeof validCalledHistory) => {
    if (items.length === 0) return 0;
    const totalMs = items.reduce((sum, item) => sum + (item.calledAt! - item.timestamp), 0);
    return totalMs / items.length / 1000 / 60;
  };

  const todayHourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourItems = todayItems.filter(item => new Date(item.calledAt!).getHours() === hour);
    return {
      label: `${hour}h`,
      avg: averageMinutes(hourItems),
      count: hourItems.length,
    };
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthDailyData = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dayItems = monthItems.filter(item => new Date(item.calledAt!).getDate() === day);
    return {
      label: `${day}`,
      avg: averageMinutes(dayItems),
      count: dayItems.length,
    };
  });

  const yearMonthlyData = Array.from({ length: 12 }, (_, index) => {
    const month = index;
    const monthGroupedItems = yearItems.filter(item => new Date(item.calledAt!).getMonth() === month);
    return {
      label: `${month + 1}`,
      avg: averageMinutes(monthGroupedItems),
      count: monthGroupedItems.length,
    };
  });

  const chartData = o2Range === 'dia'
    ? todayHourlyData
    : o2Range === 'mes'
      ? monthDailyData
      : yearMonthlyData;

  const chartAverage = o2Range === 'dia'
    ? averageMinutes(todayItems)
    : o2Range === 'mes'
      ? averageMinutes(monthItems)
      : averageMinutes(yearItems);

  const maxChartAvg = Math.max(1, ...chartData.map(item => item.avg));
  const chartBarColor = o2Range === 'dia' ? 'bg-blue-500' : o2Range === 'mes' ? 'bg-emerald-500' : 'bg-violet-500';
  const chartTitle = o2Range === 'dia' ? 'O2 - Tempo Médio de Espera (Dia)' : o2Range === 'mes' ? 'O2 - Tempo Médio de Espera (Mês)' : 'O2 - Tempo Médio de Espera (Ano)';
  const chartSubtitle = o2Range === 'dia' ? 'Média de hoje' : o2Range === 'mes' ? 'Média do mês atual' : 'Média do ano atual';
  const chartHint = o2Range === 'dia'
    ? 'Barras azuis mostram o tempo médio por hora das senhas chamadas hoje.'
    : o2Range === 'mes'
      ? 'Barras verdes mostram o tempo médio por dia do mês atual.'
      : 'Barras roxas mostram o tempo médio por mês do ano atual.';

  const nextFrangos = getNextToCall('frangos');
  const nextCarnes = getNextToCall('carnes');

  return (
    <>
    <div className={`min-h-screen bg-background text-foreground p-8${darkMode ? ' dark' : ''}`}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Hortifrúti Fartura" className="h-16 w-16 object-contain" />
            <h1 className="text-3xl font-black tracking-tight text-primary">
              Painel Administrativo
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setDarkMode(!darkMode)}
              variant="outline"
              size="sm"
            >
              {darkMode ? '☀️ Claro' : '🌙 Escuro'}
            </Button>
            <Button onClick={() => setShowResetConfirm(true)} variant="destructive">
              Resetar Fila
            </Button>
          </div>
        </div>

        {/* manual ticket generator for kiosk-less testing */}
        <div className="mb-6 p-6 bg-muted rounded-2xl">
          <h2 className="text-xl font-bold mb-4">Gerar Senha Manual</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as 'frangos' | 'carnes')}
              className="px-3 py-2 border rounded bg-background text-foreground"
            >
              <option value="frangos">Frangos</option>
              <option value="carnes">Açougue</option>
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newPriority}
                onChange={e => setNewPriority(e.target.checked)}
              />
              Prioritário
            </label>
            <Button onClick={generateManualTicket} variant="outline">
              Gerar
            </Button>
            {lastGenerated && (
              <span className="text-green-600 font-bold">{`Senha ${lastGenerated} gerada`}</span>
            )}
          </div>
        </div>

        <div className="mb-6 p-6 bg-muted rounded-2xl">
          <h2 className="text-xl font-bold mb-4">Mensagem Horizontal das TVs</h2>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="text"
                value={marqueeInput}
                onChange={(e) => setMarqueeInput(e.target.value)}
                placeholder="Ex: Não perca essa promoção!"
                maxLength={220}
                className="flex-1 rounded-md border px-3 py-2 text-base bg-background text-foreground"
              />
              <select
                value={marqueeSpeedInput}
                onChange={(e) => setMarqueeSpeedInput(Number(e.target.value))}
                className="w-full md:w-28 rounded-md border px-3 py-2 text-base bg-background text-foreground"
                title="Velocidade da rolagem"
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
                <option value={4}>4x</option>
              </select>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <label className="flex items-center gap-2 text-sm font-medium">
                Cor de fundo
                <input
                  type="color"
                  value={marqueeBgInput}
                  onChange={(e) => setMarqueeBgInput(e.target.value)}
                  className="h-8 w-14 cursor-pointer rounded border"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                Cor da fonte
                <input
                  type="color"
                  value={marqueeFontColorInput}
                  onChange={(e) => setMarqueeFontColorInput(e.target.value)}
                  className="h-8 w-14 cursor-pointer rounded border"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                Fonte
                <select
                  value={marqueeFontInput}
                  onChange={(e) => setMarqueeFontInput(e.target.value)}
                  className="rounded-md border px-3 py-1.5 text-base bg-background text-foreground"
                >
                  <option value="sans-serif">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Impact">Impact</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                Tamanho
                <input
                  type="number"
                  min={12}
                  max={72}
                  value={marqueeFontSizeInput}
                  onChange={(e) => setMarqueeFontSizeInput(Math.min(72, Math.max(12, Number(e.target.value))))}
                  className="w-20 rounded-md border px-3 py-1.5 text-base bg-background text-foreground"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </label>
              <div className="flex gap-2 md:ml-auto">
                <Button onClick={saveMarqueeMessage}>Salvar</Button>
                <Button onClick={clearMarqueeMessage} variant="outline">Limpar</Button>
              </div>
            </div>
            {marqueeInput && (
              <div
                className="h-12 overflow-hidden rounded flex items-center"
                style={{ backgroundColor: marqueeBgInput }}
              >
                <span
                  className="whitespace-nowrap font-bold px-4"
                  style={{ color: marqueeFontColorInput, fontFamily: marqueeFontInput, fontSize: `${marqueeFontSizeInput}px` }}
                >
                  {marqueeInput}
                </span>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Velocidade: 1x (normal) até 4x (mais rápido). A prévia acima mostra como ficará na TV.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Senha Atual</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-4 flex-1">
              {current ? (
                <div className="space-y-1">
                  <div className="text-3xl font-black text-primary">
                    {current.code}
                  </div>
                  <div className="text-base font-semibold">
                    {current.type === "frangos" ? "Frangos" : "Açougue"}
                    {current.priority && (
                      <Badge variant="secondary" className="ml-2">
                        Prioritário
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhuma senha chamada</p>
              )}
            </CardContent>
          </Card>

          <Card className="h-full flex flex-col border-orange-400 bg-orange-50 dark:bg-gray-800 dark:border-orange-600">
            <CardHeader>
              <CardTitle>⏭️ Chamar Próxima - Frangos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <Button
                onClick={callNextFrangos}
                disabled={frangosQueue.length === 0}
                className="w-full h-20 text-2xl font-black rounded-xl"
                variant="default"
              >
                CHAMAR FRANGOS
              </Button>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border-2 border-orange-300">
                {frangosQueue.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">Próxima na fila:</p>
                    <p className="text-2xl font-black text-orange-600">
                      {nextFrangos?.code}
                      {nextFrangos?.priority && " 🔴"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ciclo: {normalCallsSincePriority.frangos}/3 gerais
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Fila vazia</p>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Pessoas na fila</p>
                <p className="text-3xl font-black text-orange-500">{frangosQueue.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full flex flex-col border-red-400 bg-red-50 dark:bg-gray-800 dark:border-red-600">
            <CardHeader>
              <CardTitle>⏭️ Chamar Próxima - Açougue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <Button
                onClick={callNextCarnes}
                disabled={carnesQueue.length === 0}
                className="w-full h-20 text-2xl font-black rounded-xl bg-red-600 hover:bg-red-700"
              >
                CHAMAR AÇOUGUE
              </Button>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border-2 border-red-300">
                {carnesQueue.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">Próxima na fila:</p>
                    <p className="text-2xl font-black text-red-600">
                      {nextCarnes?.code}
                      {nextCarnes?.priority && " 🔴"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ciclo: {normalCallsSincePriority.carnes}/3 gerais
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Fila vazia</p>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Pessoas na fila</p>
                <p className="text-3xl font-black text-red-500">{carnesQueue.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 items-stretch">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Fila de Frangos ({frangosQueue.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {frangosQueue.length === 0 ? (
                <p className="text-muted-foreground">Fila vazia</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sortedFrangosQueue.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">{index + 1}.</span>
                        <span className="text-xl font-black">{item.code}</span>
                        <span className="text-sm font-medium">
                          Frangos
                        </span>
                        {item.priority && (
                          <Badge variant="destructive">Prioritário</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Fila de Açougue ({carnesQueue.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {carnesQueue.length === 0 ? (
                <p className="text-muted-foreground">Fila vazia</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sortedCarnesQueue.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-primary/10 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">{index + 1}.</span>
                        <span className="text-xl font-black">{item.code}</span>
                        <span className="text-sm font-medium">
                          Açougue
                        </span>
                        {item.priority && (
                          <Badge variant="destructive">Prioritário</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 items-stretch">
          <Card className="h-full flex flex-col border-orange-300">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>📋 Histórico - Frangos</span>
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  {frangosHistory.length} chamadas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border-2 border-orange-300">
                <p className="text-sm text-muted-foreground mb-1">⏱️ Tempo Médio de Espera</p>
                <p className="text-3xl font-black text-orange-600">
                  {getAverageWaitTime('frangos').toFixed(1)}s
                </p>
              </div>
              {frangosHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma senha chamada ainda</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {[...frangosHistory].reverse().slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-sm"
                    >
                      <span className="font-bold text-orange-700">{item.code}</span>
                      <span className="text-xs text-orange-600">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full flex flex-col border-red-300">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>📋 Histórico - Açougue</span>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  {carnesHistory.length} chamadas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border-2 border-red-300">
                <p className="text-sm text-muted-foreground mb-1">⏱️ Tempo Médio de Espera</p>
                <p className="text-3xl font-black text-red-600">
                  {getAverageWaitTime('carnes').toFixed(1)}s
                </p>
              </div>
              {carnesHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma senha chamada ainda</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {[...carnesHistory].reverse().slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-sm"
                    >
                      <span className="font-bold text-red-700">{item.code}</span>
                      <span className="text-xs text-red-600">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 items-stretch">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>{chartTitle}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={o2Range === 'dia' ? 'default' : 'outline'}
                    onClick={() => setO2Range('dia')}
                  >
                    Dia
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={o2Range === 'mes' ? 'default' : 'outline'}
                    onClick={() => setO2Range('mes')}
                  >
                    Mês
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={o2Range === 'ano' ? 'default' : 'outline'}
                    onClick={() => setO2Range('ano')}
                  >
                    Ano
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">{chartSubtitle}</p>
                <p className="text-3xl font-black text-primary">{chartAverage.toFixed(1)} min</p>
              </div>
              <div className="h-64 w-full overflow-hidden rounded-lg border bg-background p-3">
                <div className="flex h-full w-full items-end gap-1">
                  {chartData.map((item) => (
                    <div key={item.label} className="flex flex-1 flex-col items-center h-full justify-end min-w-0">
                      <div
                        className={item.count > 0 ? `w-full rounded-t ${chartBarColor}` : "w-full rounded-t bg-gray-200 dark:bg-gray-700"}
                        style={{ height: `${Math.max(4, (item.avg / maxChartAvg) * 100)}%` }}
                        title={`${item.label} - ${item.avg.toFixed(1)} min (${item.count} chamadas)`}
                      />
                      <span className="mt-1 text-[9px] text-muted-foreground truncate w-full text-center">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {chartHint}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* ── Modal de Confirmação de Reset ── */}
    {showResetConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">⚠️</span>
            <h2 className="text-2xl font-black text-destructive">Resetar a Fila?</h2>
            <p className="text-muted-foreground">
              Tem certeza que deseja resetar a fila? Esta ação irá encerrar o expediente,
              limpar todas as senhas pendentes e gerar um relatório do dia.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowResetConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 font-bold"
              onClick={handleConfirmReset}
            >
              Sim, Resetar
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* ── Modal de Relatório Pós-Reset ── */}
    {showReport && reportData && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-5xl">📊</span>
            <h2 className="text-2xl font-black text-primary">Relatório de Expediente</h2>
            <p className="text-sm text-muted-foreground">{reportData.date} — Gerado às {reportData.generatedAt.split(' ')[1] ?? reportData.generatedAt}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total de Senhas</p>
              <p className="text-3xl font-black text-primary">{reportData.totalTickets}</p>
            </div>
            <div className="rounded-xl bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Espera Média Geral</p>
              <p className="text-3xl font-black text-primary">{reportData.avgWaitTotal.toFixed(1)} min</p>
            </div>
            <div className="rounded-xl bg-orange-50 dark:bg-orange-950 border border-orange-200 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Frangos</p>
              <p className="text-2xl font-black text-orange-600">{reportData.frangosTotal}</p>
              <p className="text-xs text-muted-foreground">{reportData.frangosPriority} prioritários</p>
              <p className="text-xs text-orange-500 mt-1">⏱ {reportData.avgWaitFrangos.toFixed(1)} min</p>
            </div>
            <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Açougue</p>
              <p className="text-2xl font-black text-red-600">{reportData.carnesTotal}</p>
              <p className="text-xs text-muted-foreground">{reportData.carnesPriority} prioritários</p>
              <p className="text-xs text-red-500 mt-1">⏱ {reportData.avgWaitCarnes.toFixed(1)} min</p>
            </div>
          </div>

          <div className="rounded-xl bg-muted p-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Primeiro atendimento</span>
              <span className="font-semibold">{reportData.firstTicketTime ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Último atendimento</span>
              <span className="font-semibold">{reportData.lastTicketTime ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Horário de pico</span>
              <span className="font-semibold">{reportData.peakHour} ({reportData.peakHourCount} atend.)</span>
            </div>
          </div>

          {reportData.hourlyData.some(h => h.count > 0) && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Distribuição por hora</p>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {reportData.hourlyData.filter(h => h.count > 0).map(h => (
                  <div key={h.hour} className="flex items-center gap-3 text-sm">
                    <span className="w-10 font-mono text-muted-foreground">{h.hour}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${Math.min(100, (h.count / (reportData.peakHourCount || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="w-20 text-right text-xs text-muted-foreground">{h.count} · {h.avgWait.toFixed(1)} min</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowReport(false)}
            >
              Fechar
            </Button>
            <Button
              className="flex-1 font-bold"
              onClick={() => downloadReport(reportData)}
            >
              💾 Salvar Relatório
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Admin;