import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Droplets, DollarSign, TrendingUp, Calendar } from "lucide-react"

type TotalResponse = {
  period: string
  total_value_float: number
  total_value_money: string
}

type PeriodResponse = {
  period: string
  total_value: number
}

type RealtimePoint = {
  period: string
  value: number
}

const PERIODS = [
  { value: "second", label: "Tempo Real" },
  { value: "minute", label: "Minuto" },
  { value: "hour", label: "Hora" },
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
]

const CHART_PERIODS = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
]

function App() {
  const [volumePeriod, setVolumePeriod] = useState("day")
  const [moneyPeriod, setMoneyPeriod] = useState("day")
  const [chartPeriod, setChartPeriod] = useState("day")

  const [volumeTotal, setVolumeTotal] = useState<TotalResponse | null>(null)
  const [moneyTotal, setMoneyTotal] = useState<TotalResponse | null>(null)
  const [volumeChart, setVolumeChart] = useState<PeriodResponse[]>([])
  const [moneyChart, setMoneyChart] = useState<PeriodResponse[]>([])
  const [realtimeData, setRealtimeData] = useState<RealtimePoint[]>([])

  const [loading, setLoading] = useState(true)

  // Fetch total volume data
  const fetchVolumeTotal = async (period: string) => {
    try {
      const response = await fetch(`http://localhost:8080/volume-total?period=${period}`)
      const data = await response.json()
      setVolumeTotal(data)
    } catch (error) {
      console.error("Erro ao buscar volume total:", error)
    }
  }

  // Fetch total money data
  const fetchMoneyTotal = async (period: string) => {
    try {
      const response = await fetch(`http://localhost:8080/volume-total?period=${period}`)
      const data = await response.json()
      setMoneyTotal(data)
    } catch (error) {
      console.error("Erro ao buscar dinheiro total:", error)
    }
  }

  // Fetch volume chart data
  const fetchVolumeChart = async (period: string) => {
    try {
      const response = await fetch(`http://localhost:8080/volume-periodo?type=liters&period=${period}`)
      const data = await response.json()
      setVolumeChart(data)
    } catch (error) {
      console.error("Erro ao buscar dados do gráfico de volume:", error)
    }
  }

  // Fetch money chart data
  const fetchMoneyChart = async (period: string) => {
    try {
      const response = await fetch(`http://localhost:8080/volume-periodo?type=money&period=${period}`)
      const data = await response.json()
      setMoneyChart(data)
    } catch (error) {
      console.error("Erro ao buscar dados do gráfico de dinheiro:", error)
    }
  }

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      await Promise.all([
        fetchVolumeTotal(volumePeriod),
        fetchMoneyTotal(moneyPeriod),
        fetchVolumeChart(chartPeriod),
        fetchMoneyChart(chartPeriod),
      ])
      setLoading(false)
    }

    fetchInitialData()
  }, [])

  // Update volume total when period changes
  useEffect(() => {
    fetchVolumeTotal(volumePeriod)
  }, [volumePeriod])

  // Update money total when period changes
  useEffect(() => {
    fetchMoneyTotal(moneyPeriod)
  }, [moneyPeriod])

  // Update charts when period changes
  useEffect(() => {
    fetchVolumeChart(chartPeriod)
    fetchMoneyChart(chartPeriod)
  }, [chartPeriod])

  useEffect(() => {
    // busca imediata
    fetchVolumeTotal(volumePeriod)

    // cria intervalo
    const intervalId = setInterval(() => {
      fetchVolumeTotal(volumePeriod)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [volumePeriod])

  // Polling: Money Total (a cada 10s)
  useEffect(() => {
    fetchMoneyTotal(moneyPeriod)

    const intervalId = setInterval(() => {
      fetchMoneyTotal(moneyPeriod)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [moneyPeriod])

  useEffect(() => {
    const fetchLatestRealtime = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/volume-periodo?type=liters&period=second`
        )
        const arr: PeriodResponse[] = await response.json()
        if (arr.length === 0) return

        const latest = arr[0]
        setRealtimeData((prev) => {
          const novoPonto: RealtimePoint = {
            period: latest.period,
            value: latest.total_value,
          }
          const updated = [...prev, novoPonto]
          if (updated.length > 60) {
            return updated.slice(updated.length - 60)
          }
          return updated
        })
      } catch (error) {
        console.error("Erro ao buscar dado em tempo real:", error)
      }
    }

    const interval = setInterval(fetchLatestRealtime, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: chartPeriod === "day" ? "2-digit" : undefined,
      minute: chartPeriod === "day" ? "2-digit" : undefined,
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("pt-BR", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-8">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Dashboard de Consumo</h1>
        </div>

        {/* Cards de Totais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Volume Total */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume Gasto</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{volumeTotal?.total_value_float.toLocaleString("pt-BR")} ml</div>
                  <p className="text-xs text-muted-foreground">
                    Período: {PERIODS.find((p) => p.value === volumePeriod)?.label}
                  </p>
                </div>
                <Select value={volumePeriod} onValueChange={setVolumePeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Dinheiro Total */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dinheiro Gasto</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{moneyTotal?.total_value_money}</div>
                  <p className="text-xs text-muted-foreground">
                    Período: {PERIODS.find((p) => p.value === moneyPeriod)?.label}
                  </p>
                </div>
                <Select value={moneyPeriod} onValueChange={setMoneyPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controle de Período dos Gráficos */}
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Período dos Gráficos:</span>
          <Select value={chartPeriod} onValueChange={setChartPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHART_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Volume */}
          <Card>
            <CardHeader>
              <CardTitle>Consumo de Volume ao Longo do Tempo</CardTitle>
              <CardDescription>
                Volume consumido em ml por {CHART_PERIODS.find((p) => p.value === chartPeriod)?.label.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  volume: {
                    label: "Volume (ml)",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <AreaChart
                  data={volumeChart}
                  margin={{
                    left: 12,
                    right: 12,
                    top: 12,
                    bottom: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatDate} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}ml`} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value) => [`${value} ml`, "Volume"]}
                  />
                  <Area
                    dataKey="total_value"
                    type="natural"
                    fill="var(--chart-1)"
                    fillOpacity={0.4}
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Dinheiro */}
          <Card>
            <CardHeader>
              <CardTitle>Gasto Monetário ao Longo do Tempo</CardTitle>
              <CardDescription>
                Valor gasto em reais por {CHART_PERIODS.find((p) => p.value === chartPeriod)?.label.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  money: {
                    label: "Valor (R$)",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <AreaChart
                  data={moneyChart}
                  margin={{
                    left: 12,
                    right: 12,
                    top: 12,
                    bottom: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatDate} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `R$ ${value.toFixed(2)}`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, "Valor"]}
                  />
                  <Area
                    dataKey="total_value"
                    type="natural"
                    fill="var(--chart-1)"
                    fillOpacity={0.4}
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        <div className="w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Consumo em Tempo Real (últimos 60 segundos)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  realtime: {
                    label: "Volume (ml)",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[400px] w-full"
              >
                <LineChart
                  data={realtimeData}
                  margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tickFormatter={formatTime}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value}ml`}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                    labelFormatter={(value) => formatTime(value)}
                    formatter={(value) => [`${value} ml`]}
                  />
                  <Line
                    type="natural"
                    dataKey="value"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App
