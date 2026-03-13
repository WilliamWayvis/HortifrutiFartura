import { useEffect, useState } from "react";
import { useQueue } from "@/contexts/QueueContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/fartura-logo.png";

const Admin = () => {
  const { queue, current, callNextFrangos, callNextCarnes, addToQueue, getNextNumber, resetQueue, calledHistory, getAverageWaitTime, getNextToCall, normalCallsSincePriority, marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont, marqueeFontSize, setMarqueeMessage } = useQueue();

  const frangosQueue = queue.filter(item => item.type === 'frangos');
  const carnesQueue = queue.filter(item => item.type === 'carnes');
  const frangosHistory = calledHistory.filter(item => item.type === 'frangos');
  const carnesHistory = calledHistory.filter(item => item.type === 'carnes');

  const [newType, setNewType] = useState<'frangos' | 'carnes'>('frangos');
  const [newPriority, setNewPriority] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [o2Range, setO2Range] = useState<'dia' | 'mes' | 'ano'>('dia');
  const [marqueeInput, setMarqueeInput] = useState('');
  const [marqueeSpeedInput, setMarqueeSpeedInput] = useState<number>(1);
  const [marqueeBgInput, setMarqueeBgInput] = useState('#000000');
  const [marqueeFontColorInput, setMarqueeFontColorInput] = useState('#ffffff');
  const [marqueeFontInput, setMarqueeFontInput] = useState('sans-serif');
  const [marqueeFontSizeInput, setMarqueeFontSizeInput] = useState<number>(24);

  useEffect(() => {
    setMarqueeInput(marqueeMessage || '');
    setMarqueeSpeedInput(marqueeSpeed || 1);
    setMarqueeBgInput(marqueeBgColor || '#000000');
    setMarqueeFontColorInput(marqueeFontColor || '#ffffff');
    setMarqueeFontInput(marqueeFont || 'sans-serif');
    setMarqueeFontSizeInput(marqueeFontSize || 24);
  }, [marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont, marqueeFontSize]);

  const generateManualTicket = async () => {
    const prefix = newType === 'frangos' ? 'F' : 'C';
    const number = await getNextNumber(newType);
    const code = `${prefix}${newPriority ? 'P' : ''}${number}`;
    await addToQueue({ code, type: newType, priority: newPriority });
    setLastGenerated(code);
    setTimeout(() => setLastGenerated(null), 3000);
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
    <div className={`min-h-screen bg-background p-8${darkMode ? ' dark' : ''}`}>
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
            <Button onClick={resetQueue} variant="destructive">
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
  );
};

export default Admin;