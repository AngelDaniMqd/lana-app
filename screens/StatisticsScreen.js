import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, Pressable, ScrollView, ButtonText, Spinner
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import {
  AreaChart, LineChart, Grid, PieChart, BarChart, YAxis,
} from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import AppMenuPopover from '../components/AppMenuPopover';
import {
  getGraficosResumen,
  getGraficosPorDias,
  getGraficosPorCategoria,
  getGraficosTendenciaMensual,
  getGraficosCuentas,
  getCircularGastos,
  getCircularIngresos,
} from '../api';

// Select (para rangos)
import {
  Select, SelectTrigger, SelectInput, SelectIcon,
  SelectPortal, SelectBackdrop, SelectContent, SelectItem
} from '@gluestack-ui/themed';

const TABS = ['Resumen', 'Gastos', 'Ingresos', 'Cuentas', 'Tendencia'];
const RANGES = [7, 30, 90];

const Card = ({ children, ...props }) => (
  <Box
    bg="$white"
    borderRadius="$xl"
    borderWidth={1}
    borderColor="$coolGray300"
    p="$4"
    {...props}
  >
    {children}
  </Box>
);

const Dots = ({ x, y, data, stroke = '#4f46e5' }) =>
  data.map((value, index) => (
    <Circle
      key={`dot-${index}`}
      cx={x(index)}
      cy={y(value)}
      r={4}
      stroke={stroke}
      strokeWidth={2}
      fill="#fff"
    />
  ));

/* ========= Gradientes ========= */
const Gradients = () => (
  <Defs>
    <LinearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0%" stopColor="#4f46e5" stopOpacity={0.28} />
      <Stop offset="100%" stopColor="#4f46e5" stopOpacity={0.06} />
    </LinearGradient>
    <LinearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0%" stopColor="#ef4444" stopOpacity={0.28} />
      <Stop offset="100%" stopColor="#ef4444" stopOpacity={0.06} />
    </LinearGradient>
    <LinearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
      <Stop offset="100%" stopColor="#10b981" stopOpacity={0.06} />
    </LinearGradient>
    {/* Gradiente específico para la gráfica del RESUMEN (estilo Home) */}
    <LinearGradient id="resumenGradient" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0%" stopColor="#4f46e5" stopOpacity={0.28} />
      <Stop offset="100%" stopColor="#4f46e5" stopOpacity={0.06} />
    </LinearGradient>
  </Defs>
);

const currency = (n) =>
  Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 });

const currency2 = (n) =>
  Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });

/* ===========================
   HELPERS DE GRAFICADO
   =========================== */

// parse YYYY-MM-DD -> Date
const parseISO = (s) => {
  try {
    const [Y, M, D] = String(s).split('-').map(Number);
    if (!Y || !M || !D) return null;
    return new Date(Y, M - 1, D);
  } catch {
    return null;
  }
};

// suma días
const addDays = (d, n) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};

// formatea YYYY-MM-DD
const fmtISO = (d) => {
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  return `${Y}-${M}-${D}`;
};

// Genera todas las fechas entre inicio y fin (incluidas)
const datesBetween = (startISO, endISO) => {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (!start || !end || end < start) return [];
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(fmtISO(d));
  return out;
};

// Asegura al menos 2 puntos para que el chart pinte
const safeLine = (arr) => {
  if (arr.length >= 2) return arr;
  if (arr.length === 1) return [0, arr[0]];
  return [0, 0];
};

// A partir de /graficos/por-dias completa días faltantes con 0
const buildDailySeries = (porDias) => {
  const items = Array.isArray(porDias?.resumen_diario) ? porDias.resumen_diario : [];
  const start = porDias?.fecha_inicio;
  const end = porDias?.fecha_fin;

  let dates = [];
  if (start && end) {
    dates = datesBetween(start, end);
  } else if (items.length) {
    const onlyDates = items.map(it => it.fecha).sort();
    const first = onlyDates[0];
    const last = onlyDates[onlyDates.length - 1];
    dates = datesBetween(first, last);
  } else {
    return {
      labels: [],
      ingresos: safeLine([]),
      gastos: safeLine([]),
      balance: safeLine([]),
      movs: safeLine([]),
    };
  }

  const map = new Map();
  for (const it of items) map.set(String(it.fecha), it);

  const ingresos = [];
  const gastos = [];
  const balance = [];
  const movs = [];

  for (const d of dates) {
    const it = map.get(d);
    ingresos.push(Number(it?.ingresos || 0));
    gastos.push(Number(it?.gastos || 0));
    balance.push(Number(it?.balance || 0));
    movs.push(Number(it?.cantidad_movimientos || 0));
  }

  return {
    labels: dates,
    ingresos: safeLine(ingresos),
    gastos: safeLine(gastos),
    balance: safeLine(balance),
    movs: safeLine(movs),
  };
};

const formatDateOnly = (iso) => {
  try { return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' }); }
  catch { return String(iso); }
};

/* ===========================
   UI PEQUEÑOS
   =========================== */

const SectionTabs = ({ tab, setTab }) => (
  <Box px="$2" py="$2">
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 6 }}>
      <HStack space="$2">
        {TABS.map((t) => (
          <Button
            key={t}
            onPress={() => setTab(t)}
            bg={tab === t ? '$black' : '$white'}
            variant={tab === t ? 'solid' : 'outline'}
            borderColor="$black"
            borderRadius="$md"
            px="$4"
            py="$2"
          >
            <ButtonText color={tab === t ? '$white' : '$black'} fontWeight="$bold">
              {t}
            </ButtonText>
          </Button>
        ))}
      </HStack>
    </ScrollView>
  </Box>
);

const RangeSelect = ({ value, onChange }) => (
  <Select selectedValue={String(value)} onValueChange={(v) => onChange(Number(v))}>
    <SelectTrigger size="sm" variant="outline" borderColor="$coolGray300" minW={130}>
      <SelectInput placeholder="Rango" />
      <SelectIcon as={MaterialIcons} name="expand-more" />
    </SelectTrigger>
    <SelectPortal>
      <SelectBackdrop />
      <SelectContent>
        <SelectItem label="7 días" value="7" />
        <SelectItem label="30 días" value="30" />
        <SelectItem label="90 días" value="90" />
      </SelectContent>
    </SelectPortal>
  </Select>
);

const TipList = ({ items = [] }) => (
  <Card>
    <Text fontWeight="$bold" color="$black" mb="$2">Salud financiera</Text>
    <VStack space="$1">
      {items.map((t, i) => (
        <HStack key={i} space="$2" alignItems="flex-start">
          <Text color="$black">•</Text>
          <Text color="$coolGray700" flex={1}>{t}</Text>
        </HStack>
      ))}
    </VStack>
  </Card>
);

/* ===========================
   COMPONENTE
   =========================== */

export default function StatisticsScreen({
  token,
  onMenu = () => {},
  onBack = () => {},
  onStatistics = () => {},
  onDebts = () => {},
  onGoals = () => {},
  onHome = () => {},
  onNotifications = () => {},
  onLogout = () => {},
  onBudgets = () => {},
  onRecurring = () => {},
  onProfile = () => {},
}) {
  const [tab, setTab] = useState('Resumen');
  const [showPopover, setShowPopover] = useState(false);
  const [range, setRange] = useState(30);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // data
  const [resumen, setResumen] = useState(null);
  const [porDias, setPorDias] = useState({ resumen_diario: [] });
  const [porCategoria, setPorCategoria] = useState({ categorias: [], total_gastos: 0, total_ingresos: 0 });
  const [tendencia, setTendencia] = useState({ tendencia_mensual: [] });
  const [cuentas, setCuentas] = useState({ total_saldo: 0, cuentas: [] });
  const [circGastos, setCircGastos] = useState({ categorias_gastos: [], total_gastos: 0 });
  const [circIngresos, setCircIngresos] = useState({ categorias_ingresos: [], total_ingresos: 0 });

  const loadAll = async () => {
    setLoading(true);
    setErr('');
    try {
      const [
        r, d, c, t, cc, cg, ci
      ] = await Promise.all([
        getGraficosResumen(token),
        getGraficosPorDias(token, range),
        getGraficosPorCategoria(token, range),
        getGraficosTendenciaMensual(token),
        getGraficosCuentas(token),
        getCircularGastos(token, range),
        getCircularIngresos(token, range),
      ]);
      setResumen(r || null);
      setPorDias(d || { resumen_diario: [] });
      setPorCategoria(c || { categorias: [], total_gastos: 0, total_ingresos: 0 });
      setTendencia(t || { tendencia_mensual: [] });
      setCuentas(cc || { total_saldo: 0, cuentas: [] });
      setCircGastos(cg || { categorias_gastos: [], total_gastos: 0 });
      setCircIngresos(ci || { categorias_ingresos: [], total_ingresos: 0 });
    } catch (e) {
      setErr('No se pudieron cargar las estadísticas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadAll();
  }, [token, range]);

  // ===== Series diarias (rellenas) =====
  const dailyFilled = useMemo(() => buildDailySeries(porDias), [porDias]);
  const serieMovsDia = dailyFilled.movs;
  const serieIngresos = dailyFilled.ingresos;
  const serieGastos = dailyFilled.gastos;

  // === RESUMEN: lógica de gráfico estilo Home ===
  const CHART_COLOR = '#4f46e5';
  const resumenChart = useMemo(() => {
    const rawVals = Array.isArray(serieMovsDia) ? serieMovsDia.map(v => Number(v) || 0) : [];
    const hasAny = rawVals.length > 0;

    const basis = rawVals.reduce((mx, v) => Math.max(mx, Math.abs(v)), 0);
    let scale = 1, scaleNote = '', axisSuffix = '';
    if (basis >= 1e7) { scale = 1e6; scaleNote = 'Escala: millones (×1,000,000)'; axisSuffix = ' M'; }
    else if (basis >= 1e5) { scale = 1e3; scaleNote = 'Escala: miles (×1,000)'; axisSuffix = ' k'; }

    const pts = rawVals.map(v => v / scale);

    // evitar charts planos
    const maxV = Math.max(0, ...pts, 0);
    const minV = Math.min(0, ...pts, 0);
    let yMaxDesired = Math.ceil(maxV * 10) / 10;
    let yMinDesired = Math.floor(minV * 10) / 10;
    if (yMaxDesired - yMinDesired < 0.1) yMaxDesired = yMinDesired + 0.1;

    const rangoTexto = hasAny && dailyFilled.labels.length
      ? `${formatDateOnly(dailyFilled.labels[0])} → ${formatDateOnly(dailyFilled.labels[dailyFilled.labels.length - 1])}`
      : (porDias?.periodo || 'Sin datos');

    return { pts: pts.length >= 2 ? pts : [0, ...pts], yMinDesired, yMaxDesired, scaleNote, axisSuffix, rangoTexto };
  }, [serieMovsDia, dailyFilled.labels, porDias?.periodo]);

  const [axisYRes, setAxisYRes] = useState({ yMin: null, yMax: null, scaleNote: '', axisSuffix: '' });
  useEffect(() => {
    if (!resumenChart) return;
    // resetea si cambia el tipo de escala
    if (axisYRes.yMin === null || axisYRes.axisSuffix !== resumenChart.axisSuffix || axisYRes.scaleNote !== resumenChart.scaleNote) {
      setAxisYRes({
        yMin: resumenChart.yMinDesired,
        yMax: resumenChart.yMaxDesired,
        scaleNote: resumenChart.scaleNote,
        axisSuffix: resumenChart.axisSuffix,
      });
      return;
    }
    const yMin = Math.min(axisYRes.yMin, resumenChart.yMinDesired);
    const yMax = Math.max(axisYRes.yMax, resumenChart.yMaxDesired);
    if (yMin !== axisYRes.yMin || yMax !== axisYRes.yMax) setAxisYRes(prev => ({ ...prev, yMin, yMax }));
  }, [resumenChart.yMinDesired, resumenChart.yMaxDesired, resumenChart.scaleNote, resumenChart.axisSuffix, resumenChart.pts]);

  // ==== Pie gastos/ingresos ====
  const pieGastosData = useMemo(() => {
    const cats = Array.isArray(circGastos?.categorias_gastos) ? circGastos.categorias_gastos : [];
    const palette = ['#5B5BF6', '#A259F7', '#F76B5B', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];
    return cats.map((c, i) => ({
      key: `g-${c.categoria}-${i}`,
      value: Number(c.monto || 0),
      svg: { fill: palette[i % palette.length] },
      label: `${c.categoria} (${Number(c.porcentaje || 0).toFixed(1)}%)`,
    }));
  }, [circGastos]);

  const pieIngresosData = useMemo(() => {
    const cats = Array.isArray(circIngresos?.categorias_ingresos) ? circIngresos.categorias_ingresos : [];
    const palette = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#5B5BF6', '#22d3ee'];
    return cats.map((c, i) => ({
      key: `i-${c.categoria}-${i}`,
      value: Number(c.monto || 0),
      svg: { fill: palette[i % palette.length] },
      label: `${c.categoria} (${Number(c.porcentaje || 0).toFixed(1)}%)`,
    }));
  }, [circIngresos]);

  // ==== Cuentas comparativas ====
  const cuentasBars = useMemo(() => {
    const list = Array.isArray(cuentas?.cuentas) ? cuentas.cuentas : [];
    const maxSaldo = Math.max(1, ...list.map(c => Number(c.saldo || 0)));
    const maxMovs  = Math.max(1, ...list.map(c => Number(c.movimientos || 0)));
    const byMovs   = [...list].sort((a,b) => (b.movimientos||0) - (a.movimientos||0));
    return { list, maxSaldo, maxMovs, byMovs };
  }, [cuentas]);

  // ==== Tendencia mensual ====
  const tendenciaMeses = useMemo(() => {
    const arr = Array.isArray(tendencia?.tendencia_mensual) ? tendencia.tendencia_mensual : [];
    const ordered = [...arr].sort((a,b) => (a.año === b.año ? a.mes - b.mes : a.año - b.año));
    const ingresos = ordered.map(m => Number(m.ingresos || 0));
    const gastos   = ordered.map(m => Number(m.gastos || 0));
    const balance  = ordered.map(m => Number(m.balance || 0));
    const labels   = ordered.map(m => m.mes_nombre?.slice(0,3) || `${m.mes}`);

    const sumI = ingresos.reduce((s,v)=>s+v,0);
    const sumG = gastos.reduce((s,v)=>s+v,0);
    return { labels, ingresos, gastos, balance, sumI, sumG };
  }, [tendencia]);

  // ==== Tips por pestaña ====
  const tipsByTab = useMemo(() => {
    return {
      Resumen: [
        'Identifica el día con más movimientos y revisa esas categorías.',
        'Si ves picos frecuentes, agrupa compras y usa listas para evitar compras impulsivas.',
      ],
      Gastos: [
        'Aplica 50/30/20: intenta que tus gastos fijos y necesarios no superen el 50% de tus ingresos.',
        'Pon un tope semanal a “gastos hormiga” y monitorea su avance.',
      ],
      Ingresos: [
        'Separa automáticamente un % de cada ingreso a ahorro / inversión el mismo día que cobras.',
        'Diversifica si puedes: una segunda fuente reduce la presión del gasto mensual.',
      ],
      Cuentas: [
        'Usa una cuenta barata para pagos diarios y evita comisiones.',
        'Mantén una cuenta solo para ahorro y no la mezcles con gastos.',
      ],
      Tendencia: [
        'Si el gasto supera al ingreso en varios meses, recorta 1–2 categorías de alto impacto.',
        'Sigue tu promedio móvil 3M para detectar tendencia real.',
      ],
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <Box flex={1} bg="$white">
        {/* Header */}
        <HStack
          px="$6"
          py="$4"
          alignItems="center"
          justifyContent="space-between"
          borderBottomWidth={1}
          borderBottomColor="$coolGray200"
        >
          <AppMenuPopover
            showPopover={showPopover}
            setShowPopover={setShowPopover}
            onHome={onHome}
            onMenu={onMenu}
            onStatistics={onStatistics}
            onDebts={onDebts}
            onGoals={onGoals}
            onBudgets={onBudgets}
            onRecurring={onRecurring}
            onLogout={onLogout}
            onProfile={onProfile}
          />
          <Text fontSize="$2xl" fontWeight="$bold" color="$black">Estadísticas</Text>
          <Pressable rounded="$full" p="$2" bg="$coolGray100" onPress={loadAll}>
            <Icon as={MaterialIcons} name="refresh" size={22} color="$black" />
          </Pressable>
        </HStack>

        {/* Tabs scrolleables */}
        <SectionTabs tab={tab} setTab={setTab} />

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {loading ? (
            <HStack space="$2" alignItems="center" justifyContent="center" py="$6">
              <Spinner />
              <Text color="$coolGray600">Cargando…</Text>
            </HStack>
          ) : err ? (
            <Card>
              <HStack space="$2" alignItems="center">
                <Icon as={MaterialIcons} name="error-outline" size={22} color="$red600" />
                <Text color="$red600">{err}</Text>
              </HStack>
            </Card>
          ) : (
            <>
              {/* ===== TAB RESUMEN ===== */}
              {tab === 'Resumen' && (
                <VStack space="$4">
                  {/* (A) Gráfica estilo HOME: Movimientos diarios (con eje Y y gradiente) */}
                  <Card>
                    <HStack justifyContent="space-between" alignItems="center" mb="$1">
                      <VStack>
                        <Text fontWeight="$bold" fontSize="$md" color="$black">Movimientos diarios</Text>
                        <Text color="$coolGray500" fontSize="$xs">
                          {resumenChart.rangoTexto}
                        </Text>
                      </VStack>
                      <RangeSelect value={range} onChange={setRange} />
                    </HStack>

                    <HStack justifyContent="space-between" alignItems="center" mb="$2">
                      <Text color="$coolGray600" fontSize="$xs">
                        {porDias?.periodo || ''}
                      </Text>
                      {axisYRes.scaleNote ? (
                        <Text color="$coolGray500" fontSize="$xs">{axisYRes.scaleNote}</Text>
                      ) : null}
                    </HStack>

                    <Box h={188}>
                      {!resumenChart.pts || resumenChart.pts.length < 2 ? (
                        <HStack flex={1} alignItems="center" justifyContent="center">
                          <Text color="$coolGray500" fontSize="$xs">Sin datos para graficar.</Text>
                        </HStack>
                      ) : (
                        <HStack alignItems="stretch" style={{ height: 188 }}>
                          <YAxis
                            style={{ width: 34, marginRight: 8 }}
                            data={resumenChart.pts}
                            numberOfTicks={5}
                            contentInset={{ top: 16, bottom: 1 }}
                            svg={{ fill: '#64748b', fontSize: 10 }}
                            formatLabel={(value) =>
                              `${Number(value).toLocaleString('es-MX', { maximumFractionDigits: 1, minimumFractionDigits: 0 })}${axisYRes.axisSuffix || ''}`
                            }
                          />
                          <Box flex={1}>
                            <AreaChart
                              style={{ height: 188 }}
                              data={resumenChart.pts}
                              yMin={axisYRes.yMin ?? resumenChart.yMinDesired}
                              yMax={axisYRes.yMax ?? resumenChart.yMaxDesired}
                              contentInset={{ top: 16, bottom: 1 }}
                              curve={shape.curveMonotoneX}
                              svg={{ fill: 'url(#resumenGradient)', stroke: CHART_COLOR, strokeWidth: 2 }}
                            >
                              <Grid svg={{ strokeOpacity: 0.12 }} />
                              <Gradients />
                              <Dots stroke={CHART_COLOR} />
                            </AreaChart>
                          </Box>
                        </HStack>
                      )}
                    </Box>
                  </Card>

                  {/* (B) Ingresos vs Gastos (diario) — mantenemos esta comparación aquí */}
                  <Card>
                    <HStack justifyContent="space-between" alignItems="center" mb="$1">
                      <Text fontWeight="$bold" fontSize="$md" color="$black">Ingresos vs Gastos (diario)</Text>
                      <RangeSelect value={range} onChange={setRange} />
                    </HStack>

                    <Box h={140}>
                      <LineChart
                        style={{ height: 140 }}
                        data={serieIngresos}
                        contentInset={{ top: 20, bottom: 20 }}
                        curve={shape.curveMonotoneX}
                        svg={{ stroke: '#10b981', strokeWidth: 2 }}
                      >
                        <Grid svg={{ strokeOpacity: 0.08 }} />
                      </LineChart>
                      <LineChart
                        style={{ height: 140, position: 'absolute', left: 0, right: 0 }}
                        data={serieGastos}
                        contentInset={{ top: 20, bottom: 20 }}
                        curve={shape.curveMonotoneX}
                        svg={{ stroke: '#ef4444', strokeWidth: 2 }}
                      />
                    </Box>

                    <HStack space="$4" mt="$2" justifyContent="center">
                      <HStack space="$1" alignItems="center">
                        <Box w={10} h={10} bg="$emerald600" borderRadius="$full" />
                        <Text fontSize="$xs">Ingresos</Text>
                      </HStack>
                      <HStack space="$1" alignItems="center">
                        <Box w={10} h={10} bg="$red600" borderRadius="$full" />
                        <Text fontSize="$xs">Gastos</Text>
                      </HStack>
                    </HStack>
                  </Card>

                  {/* (C) Resumen del mes */}
                  <Card>
                    <HStack justifyContent="space-between" mb="$2">
                      <VStack>
                        <Text fontWeight="$bold" fontSize="$md" color="$black">Resumen del mes</Text>
                        <Text color="$coolGray500" fontSize="$xs">{resumen?.usuario || ''}</Text>
                      </VStack>
                      <Text fontWeight="$bold" fontSize="$md" color={Number(resumen?.balance_mes||0) >= 0 ? '$emerald600' : '$red600'}>
                        {Number(resumen?.balance_mes||0) >= 0 ? 'Balance +' : 'Balance -'}
                      </Text>
                    </HStack>
                    <HStack space="$4" flexWrap="wrap">
                      <VStack flex={1} minW="45%">
                        <Text color="$coolGray500">Saldo total</Text>
                        <Text fontWeight="$bold" fontSize="$xl" color="$black">MXN {currency(resumen?.total_saldo)}</Text>
                      </VStack>
                      <VStack flex={1} minW="45%">
                        <Text color="$coolGray500">Movimientos</Text>
                        <Text fontWeight="$bold" fontSize="$xl" color="$black">{resumen?.total_movimientos || 0}</Text>
                      </VStack>
                    </HStack>
                    <HStack space="$4" mt="$3" flexWrap="wrap">
                      <VStack flex={1} minW="45%">
                        <Text color="$coolGray500">Ingresos mes</Text>
                        <Text fontWeight="$bold" fontSize="$lg" color="$emerald700">MXN {currency(resumen?.ingresos_mes)}</Text>
                      </VStack>
                      <VStack flex={1} minW="45%">
                        <Text color="$coolGray500">Gastos mes</Text>
                        <Text fontWeight="$bold" fontSize="$lg" color="$red600">MXN {currency(resumen?.gastos_mes)}</Text>
                      </VStack>
                    </HStack>
                  </Card>

                  <TipList items={tipsByTab.Resumen} />
                </VStack>
              )}

              {/* ===== TAB GASTOS ===== */}
              {tab === 'Gastos' && (
                <VStack space="$4">
                  <Card>
                    <HStack justifyContent="space-between" alignItems="center">
                      <Text fontWeight="$bold" fontSize="$md" color="$black">Gastos por categoría</Text>
                      <RangeSelect value={range} onChange={setRange} />
                    </HStack>

                    <Text fontWeight="$bold" fontSize="$xl" color="$black" mt="$1">
                      MXN {currency(circGastos?.total_gastos)}
                    </Text>

                    <Box alignItems="center" justifyContent="center" mt="$2" mb="$3">
                      <PieChart
                        style={{ height: 200, width: 200 }}
                        data={pieGastosData.length ? pieGastosData : [{ value: 1, svg: { fill: '#e5e7eb' }, key: 'empty' }]}
                        innerRadius={60}
                        padAngle={0.02}
                        sort={() => 0}
                      />
                      <Box position="absolute" top={70} left={0} right={0} alignItems="center">
                        <Text fontWeight="$bold" fontSize="$md" color="$black">Total</Text>
                        <Text fontWeight="$bold" fontSize="$md" color="$black">MXN {currency(circGastos?.total_gastos)}</Text>
                      </Box>
                    </Box>

                    <VStack space="$2" mt="$2">
                      {pieGastosData.slice(0, 6).map((d) => (
                        <HStack key={d.key} justifyContent="space-between" alignItems="center">
                          <HStack space="$2" alignItems="center">
                            <Box w={12} h={12} bg={d.svg.fill} borderRadius="$full" />
                            <Text>{d.label}</Text>
                          </HStack>
                          <Text fontWeight="$bold">MXN {currency2(d.value)}</Text>
                        </HStack>
                      ))}
                      {pieGastosData.length === 0 && (
                        <Text color="$coolGray500">Sin datos de gastos en este periodo.</Text>
                      )}
                    </VStack>
                  </Card>

                  {/* Detalle /por-categoria */}
                  <Card>
                    <Text fontWeight="$bold" fontSize="$md" color="$black" mb="$2">Detalle de categorías</Text>
                    {Array.isArray(porCategoria?.categorias) && porCategoria.categorias.length > 0 ? (
                      porCategoria.categorias.map((c, idx) => (
                        <VStack key={`${c.categoria}-${idx}`} mb="$3">
                          <HStack justifyContent="space-between">
                            <Text fontWeight="$bold" color="$black">{c.categoria}</Text>
                            <Text color="$red700">Gasto: MXN {currency2(c.gastos)}</Text>
                          </HStack>
                          <Box bg="$coolGray200" h={10} borderRadius="$md" w="100%" mt="$1">
                            <Box
                              bg="$red600"
                              h="100%"
                              borderRadius="$md"
                              w={`${Math.min(100, Number(c.porcentaje_gastos || 0))}%`}
                            />
                          </Box>
                          <HStack justifyContent="space-between" mt="$1">
                            <Text color="$coolGray600" fontSize="$xs">
                              Ingresos: MXN {currency2(c.ingresos)} ({Number(c.porcentaje_ingresos||0).toFixed(1)}%)
                            </Text>
                            <Text color="$coolGray600" fontSize="$xs">
                              Movs: {c.cantidad || 0}
                            </Text>
                          </HStack>
                        </VStack>
                      ))
                    ) : (
                      <Text color="$coolGray500">Sin desglose disponible.</Text>
                    )}
                  </Card>

                  <TipList items={tipsByTab.Gastos} />
                </VStack>
              )}

              {/* ===== TAB INGRESOS ===== */}
              {tab === 'Ingresos' && (
                <VStack space="$4">
                  <Card>
                    <HStack justifyContent="space-between" alignItems="center">
                      <Text fontWeight="$bold" fontSize="$md" color="$black">Ingresos por categoría</Text>
                      <RangeSelect value={range} onChange={setRange} />
                    </HStack>

                    <Text fontWeight="$bold" fontSize="$xl" color="$black" mt="$1">
                      MXN {currency(circIngresos?.total_ingresos)}
                    </Text>

                    <Box alignItems="center" justifyContent="center" mt="$2" mb="$3">
                      <PieChart
                        style={{ height: 200, width: 200 }}
                        data={pieIngresosData.length ? pieIngresosData : [{ value: 1, svg: { fill: '#e5e7eb' }, key: 'empty' }]}
                        innerRadius={60}
                        padAngle={0.02}
                        sort={() => 0}
                      />
                      <Box position="absolute" top={70} left={0} right={0} alignItems="center">
                        <Text fontWeight="$bold" fontSize="$md" color="$black">Total</Text>
                        <Text fontWeight="$bold" fontSize="$md" color="$black">MXN {currency(circIngresos?.total_ingresos)}</Text>
                      </Box>
                    </Box>

                    <VStack space="$2" mt="$2">
                      {pieIngresosData.slice(0, 6).map((d) => (
                        <HStack key={d.key} justifyContent="space-between" alignItems="center">
                          <HStack space="$2" alignItems="center">
                            <Box w={12} h={12} bg={d.svg.fill} borderRadius="$full" />
                            <Text>{d.label}</Text>
                          </HStack>
                          <Text fontWeight="$bold">MXN {currency2(d.value)}</Text>
                        </HStack>
                      ))}
                      {pieIngresosData.length === 0 && (
                        <Text color="$coolGray500">Sin datos de ingresos en este periodo.</Text>
                      )}
                    </VStack>
                  </Card>

                  <TipList items={tipsByTab.Ingresos} />
                </VStack>
              )}

              {/* ===== TAB CUENTAS ===== */}
              {tab === 'Cuentas' && (
                <VStack space="$4">
                  <Card>
                    <Text fontWeight="$bold" fontSize="$md" color="$black">Resumen de cuentas</Text>
                    <Text color="$coolGray600" fontSize="$xs" mb="$2">Saldo total: MXN {currency(cuentas?.total_saldo)}</Text>

                    <VStack space="$3">
                      {cuentasBars.list.length === 0 && (
                        <Text color="$coolGray500">No hay cuentas para mostrar.</Text>
                      )}
                      {cuentasBars.list.map((c) => {
                        const pct = Math.max(2, Math.round((Number(c.saldo || 0) / cuentasBars.maxSaldo) * 100));
                        return (
                          <VStack key={c.id} space="$1">
                            <HStack justifyContent="space-between">
                              <Text color="$black" numberOfLines={1} ellipsizeMode="tail">{c.nombre}</Text>
                              <Text color="$black">MXN {currency2(c.saldo)}</Text>
                            </HStack>
                            <Box bg="$coolGray200" h={10} borderRadius="$md" w="100%">
                              <Box bg="#5B5BF6" h="100%" borderRadius="$md" w={`${pct}%`} />
                            </Box>
                            <Text color="$coolGray500" fontSize="$xs">Movimientos: {c.movimientos || 0}</Text>
                          </VStack>
                        );
                      })}
                    </VStack>
                  </Card>

                  <Card>
                    <Text fontWeight="$bold" fontSize="$md" color="$black" mb="$2">Uso por cuenta (movimientos)</Text>
                    {cuentasBars.byMovs.length === 0 ? (
                      <Text color="$coolGray500">Sin datos.</Text>
                    ) : (
                      <VStack space="$3">
                        {cuentasBars.byMovs.map((c, idx) => {
                          const pct = Math.max(2, Math.round((Number(c.movimientos || 0) / cuentasBars.maxMovs) * 100));
                          return (
                            <VStack key={`mov-${c.id}`} space="$1">
                              <HStack justifyContent="space-between">
                                <Text color="$black">{idx + 1}. {c.nombre}</Text>
                                <Text color="$black">{c.movimientos || 0} movs</Text>
                              </HStack>
                              <Box bg="$coolGray200" h={8} borderRadius="$md" w="100%">
                                <Box bg="#22c55e" h="100%" borderRadius="$md" w={`${pct}%`} />
                              </Box>
                            </VStack>
                          );
                        })}
                      </VStack>
                    )}
                  </Card>

                  <TipList items={tipsByTab.Cuentas} />
                </VStack>
              )}

              {/* ===== TAB TENDENCIA ===== */}
              {tab === 'Tendencia' && (
                <VStack space="$4">
                  <Card>
                    <Text fontWeight="$bold" fontSize="$md" color="$black" mb="$2">Tendencia mensual</Text>
                    {tendenciaMeses.balance.length === 0 ? (
                      <Text color="$coolGray500">Sin datos de tendencia.</Text>
                    ) : (
                      <>
                        <Text color="$coolGray600" fontSize="$xs">Balance por mes</Text>
                        <Box h={160} mt="$2">
                          <BarChart
                            style={{ height: 160 }}
                            data={tendenciaMeses.balance}
                            svg={{ fill: '#4f46e5' }}
                            contentInset={{ top: 16, bottom: 16 }}
                            spacingInner={0.3}
                            gridMin={Math.min(...tendenciaMeses.balance, 0)}
                          >
                            <Grid svg={{ strokeOpacity: 0.08 }} />
                          </BarChart>
                        </Box>
                        <HStack justifyContent="space-between" mt="$1">
                          {tendenciaMeses.labels.slice(0, 6).map((l, i) => (
                            <Text key={`${l}-${i}`} fontSize="$xs" color="$coolGray400">{l}</Text>
                          ))}
                        </HStack>

                        {/* Eliminado: Ingresos vs Gastos en TENDENCIA (según pedido) */}

                        <HStack mt="$3" justifyContent="space-between">
                          <Text color="$coolGray700">
                            {tendenciaMeses.sumI >= tendenciaMeses.sumG
                              ? 'Ingresos > Gastos'
                              : 'Gastos > Ingresos'}
                          </Text>
                          <Text color={tendenciaMeses.sumI >= tendenciaMeses.sumG ? '$emerald700' : '$red700'} fontWeight="$bold">
                            MXN {currency2(Math.abs(tendenciaMeses.sumI - tendenciaMeses.sumG))}
                          </Text>
                        </HStack>
                      </>
                    )}
                  </Card>

                  <TipList items={tipsByTab.Tendencia} />
                </VStack>
              )}
            </>
          )}
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
