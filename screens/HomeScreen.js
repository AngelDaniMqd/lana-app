import React, { useMemo, useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, ScrollView, Pressable, ButtonText, Divider,
  Input, InputField, InputIcon, InputSlot,
  FormControl, FormControlLabel, FormControlLabelText, FormControlError, FormControlErrorText,
  Popover, PopoverBackdrop, PopoverContent, PopoverArrow, PopoverBody,
  Spinner,
} from '@gluestack-ui/themed';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { AreaChart, Grid, YAxis } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import AppMenuPopover from '../components/AppMenuPopover';
import {
  getCuentas, postCuenta, putCuenta, deleteCuenta,
  getGraficoResumen, getGraficoPorDias, getGraficoCuentas,
  getRegistros, getMetodos, getSubcategorias,
} from '../api';
// Colores llamativos para las sombras de las cuentas
const ACCOUNT_SHADOW_COLORS = [
  '#f87171', // rojo
  '#fbbf24', // amarillo
  '#34d399', // verde
  '#60a5fa', // azul
  '#a78bfa', // morado
  '#f472b6', // rosa
];
/** ---------- Tarjeta KPI con info ---------- */
const KpiCard = ({ label, value, delta, positive, icon = 'chart-line', info }) => (
  <Box
    bg="$white"
    borderRadius="$xl"
    p="$4"
    borderWidth={1}
    borderColor="$coolGray200"
    mr="$3"
    minW={200}
    style={{
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    }}
  >
    <HStack alignItems="center" justifyContent="space-between">
      <HStack alignItems="center" space="$1">
        <Text color="$coolGray600" fontSize="$xs" numberOfLines={1}>{label}</Text>
        {info ? (
          <Popover placement="bottom left" trigger={(triggerProps) => (
            <Pressable {...triggerProps} accessibilityLabel={`Info ${label}`}>
              <Icon as={MaterialIcons} name="info-outline" size={14} color="$coolGray500" />
            </Pressable>
          )}>
            <PopoverBackdrop />
            <PopoverContent maxWidth={280}>
              <PopoverArrow />
              <PopoverBody>
                <Text color="$black" fontSize="$xs">{info}</Text>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        ) : null}
      </HStack>
      <Icon as={MaterialCommunityIcons} name={icon} size={18} color="$coolGray500" />
    </HStack>

    <HStack alignItems="baseline" space="$2" mt="$2">
      <Text color="$black" fontSize="$xl" fontWeight="$bold" numberOfLines={1}>{value}</Text>
      {!!delta && (
        <Text color={positive ? '$green600' : '$red600'} fontSize="$xs" numberOfLines={1}>
          {delta}
        </Text>
      )}
    </HStack>
  </Box>
);

/** ---------- Card de cuenta con menú ---------- */
const AccountCard = ({
  title,
  amount,
  icon = 'wallet',
  onEdit = () => {},
  onDelete = () => {},
  isMenuOpen = false,
  onOpenMenu = () => {},
  onCloseMenu = () => {},
  shadowColor = '#000',
}) => (
  <Box
    bg="$white"
    borderRadius="$xl"
    p="$5"
    borderWidth={1}
    borderColor="$coolGray200"
    mr="$3"
    minW={260}
    style={{
    shadowColor: shadowColor, 
    shadowOpacity: 0.34,      // Más opacidad
    shadowRadius: 10,         // Más grande
    shadowOffset: { width: 0, height: 16 }, // Más desplazada hacia abajo
    elevation: 8,            // Más grande en Android
  }}
    position="relative"
  >
    <Popover
      isOpen={isMenuOpen}
      onClose={onCloseMenu}
      placement="bottom right"
      trigger={(triggerProps) => (
        <Pressable
          {...triggerProps}
          onPress={onOpenMenu}
          position="absolute"
          top={10}
          right={10}
          rounded="$full"
          p="$3"
          bg="$coolGray100"
          zIndex={2}
          style={{ minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon as={MaterialIcons} name="more-vert" size={22} color="$black" />
        </Pressable>
      )}
    >
      <PopoverBackdrop />
      <PopoverContent w={200}>
        <PopoverArrow />
        <PopoverBody p={0}>
          <VStack divider={<Box h={1} bg="$coolGray100" />} space={0}>
            <Pressable px="$4" py="$3" onPress={() => { onCloseMenu(); onEdit(); }}>
              <HStack space="$2" alignItems="center">
                <Icon as={MaterialIcons} name="edit" size={20} color="$black" />
                <Text color="$black">Editar</Text>
              </HStack>
            </Pressable>
            <Pressable px="$4" py="$3" onPress={() => { onCloseMenu(); onDelete(); }}>
              <HStack space="$2" alignItems="center">
                <Icon as={MaterialIcons} name="delete-outline" size={20} color="$red600" />
                <Text color="$red600">Eliminar</Text>
              </HStack>
            </Pressable>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>

    <HStack alignItems="center" justifyContent="space-between" pr={12}>
      <Text color="$black" fontSize="$md" fontWeight="$semibold" numberOfLines={1}>
        {title}
      </Text>
      <Icon as={MaterialCommunityIcons} name={icon} size={26} color="$black" />
    </HStack>

    <Text mt="$3" color="$black" fontSize="$2xl" fontWeight="$bold" numberOfLines={1}>
      {amount}
    </Text>
  </Box>
);

// ===== Helpers =====
const fmtMoney = (n) => (typeof n === 'number' && !isNaN(n) ? `MXN ${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}` : '—');
const fmtMoney2 = (n) => (typeof n === 'number' && !isNaN(n) ? `MXN ${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—');
const pct = (num, den) => {
  if (!isFinite(num) || !isFinite(den) || Math.abs(den) < 1e-9) return '—';
  const r = Math.round((num / den) * 1000) / 10;
  return `${r >= 0 ? '+' : ''}${r}%`;
};
const moneySign = (n) => (n < 0 ? '-' : '+');
const colorBySign = (n) => (n < 0 ? '$red600' : '$green600');
const formatDateOnly = (iso) => {
  try { return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' }); }
  catch { return String(iso).split('T')[0] || '—'; }
};

// Color de la gráfica
const CHART_COLOR = '#16a34a';

// redondeo 1 decimal
const round1Up = (x) => Math.ceil(x * 10) / 10;
const round1Down = (x) => Math.floor(x * 10) / 10;

/** Gradiente para el área */
const Gradient = ({ color }) => (
  <Defs>
    <LinearGradient id="last5Gradient" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0%" stopColor={color} stopOpacity={0.28} />
      <Stop offset="100%" stopColor={color} stopOpacity={0.06} />
    </LinearGradient>
  </Defs>
);

export default function HomeScreen({
  user,
  token,
  onAdd,
  onMenu,
  onStatistics,
  onDebts,
  onGoals,
  onHome,
  onNotifications,
  onBudgets,
  onRecurring,
  onLogout,
  onProfile,
  ...props
}) {
  const [showPopover, setShowPopover] = useState(false);

  // Formulario cuenta
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountForm, setAccountForm] = useState({ name: '', type: '', balance: '' });
  const [editingAccountId, setEditingAccountId] = useState(null);

  const validMoney = (v) => /^(\d+)([.,]\d{1,2})?$/.test(String(v).replace(',', '.'));
  const accountValid = accountForm.name.trim() && validMoney(accountForm.balance);

  const openAccountForm = () => {
    setEditingAccountId(null);
    setAccountForm({ name: '', type: '', balance: '' });
    setShowAccountForm(true);
  };

  const startEditAccount = (acc) => {
    setEditingAccountId(acc.id);
    setAccountForm({
      name: acc.nombre || '',
      type: '',
      balance: String(acc.cantidad ?? ''),
    });
    setShowAccountForm(true);
  };

  // Cuentas
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Analíticas (para KPIs)
  const [resumen, setResumen] = useState(null);
  const [porDias, setPorDias] = useState(null);
  const [cuentasResumen, setCuentasResumen] = useState(null);
  const [loadingCharts, setLoadingCharts] = useState(true);

  // Registros y catálogos
  const [registros, setRegistros] = useState([]);
  const [loadingRegistros, setLoadingRegistros] = useState(true);
  const [metodos, setMetodos] = useState([]);
  const [subcats, setSubcats] = useState([]);

  // Confirmación para eliminar cuenta
  const [confirmDeleteAcc, setConfirmDeleteAcc] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    if (!token || !user?.id) return;
    setLoadingAccounts(true);
    getCuentas(token)
      .then(data => setAccounts(data.filter(acc => acc.usuarios_id === user.id)))
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  }, [token, user?.id]);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    setLoadingCharts(true);

    Promise.allSettled([
      getGraficoResumen(token),
      getGraficoPorDias(token, 30),
      getGraficoCuentas(token),
    ])
      .then(([r1, r2, r3]) => {
        if (!isMounted) return;
        setResumen(r1.status === 'fulfilled' ? r1.value : null);
        setPorDias(r2.status === 'fulfilled' ? r2.value : null);
        setCuentasResumen(r3.status === 'fulfilled' ? r3.value : null);
      })
      .finally(() => isMounted && setLoadingCharts(false));

    return () => { isMounted = false; };
  }, [token]);

  // Cargar registros y catálogos
  useEffect(() => {
    if (!token) return;
    setLoadingRegistros(true);
    Promise.allSettled([getRegistros(token), getMetodos(token), getSubcategorias(token)])
      .then(([rRegs, rMet, rSub]) => {
        setRegistros(rRegs.status === 'fulfilled' && Array.isArray(rRegs.value) ? rRegs.value : []);
        setMetodos(rMet.status === 'fulfilled' && Array.isArray(rMet.value) ? rMet.value : []);
        setSubcats(rSub.status === 'fulfilled' && Array.isArray(rSub.value) ? rSub.value : []);
      })
      .finally(() => setLoadingRegistros(false));
  }, [token]);

  // ====== ÚNICA GRÁFICA: últimos 5 registros de TODAS las cuentas ======
  const chartPts = useMemo(() => {
    // considerar solo registros de cuentas del usuario
    const ids = new Set(accounts.map(a => a.id));
    let list = Array.isArray(registros) ? registros.filter(r => ids.has(r.lista_cuentas_id)) : [];

    // tomar los 5 más recientes (sin importar la cuenta), luego ordenar cronológico para graficar
    list.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
    const last5 = list.slice(0, 5);
    last5.sort((a, b) => new Date(a.fecha_registro) - new Date(b.fecha_registro));

    const rawVals = last5.map((m) => Number(m?.monto ?? 0));
    const hasAny = rawVals.length > 0;

    // escala automática a miles/millones
    const basis = rawVals.reduce((mx, v) => Math.max(mx, Math.abs(Number(v) || 0)), 0);
    let scale = 1, scaleNote = '', axisSuffix = '';
    if (basis >= 1e7) { scale = 1e6; scaleNote = 'Escala: millones (×1,000,000)'; axisSuffix = ' M'; }
    else if (basis >= 1e5) { scale = 1e3; scaleNote = 'Escala: miles (×1,000)'; axisSuffix = ' k'; }

    const pts = rawVals.map(v => (Number(v) || 0) / scale);

    let yMaxDesired = round1Up(Math.max(0, ...pts, 0));
    let yMinDesired = round1Down(Math.min(0, ...pts, 0));
    if (yMaxDesired - yMinDesired < 0.1) yMaxDesired = yMinDesired + 0.1;

    const rangoTexto = hasAny
      ? `${formatDateOnly(last5[0]?.fecha_registro)} → ${formatDateOnly(last5[last5.length - 1]?.fecha_registro)}`
      : 'Sin datos';

    return { pts, yMinDesired, yMaxDesired, scaleNote, axisSuffix, rangoTexto };
  }, [registros, accounts]);

  // Ejes "pegajosos"
  const [axisY, setAxisY] = useState({ yMin: null, yMax: null, scaleNote: '', axisSuffix: '' });
  useEffect(() => {
    if (!chartPts) return;
    if (axisY.yMin === null || axisY.axisSuffix !== chartPts.axisSuffix || axisY.scaleNote !== chartPts.scaleNote) {
      setAxisY({
        yMin: chartPts.yMinDesired,
        yMax: chartPts.yMaxDesired,
        scaleNote: chartPts.scaleNote,
        axisSuffix: chartPts.axisSuffix,
      });
      return;
    }
    const yMin = Math.min(axisY.yMin, chartPts.yMinDesired);
    const yMax = Math.max(axisY.yMax, chartPts.yMaxDesired);
    if (yMin !== axisY.yMin || yMax !== axisY.yMax) setAxisY(prev => ({ ...prev, yMin, yMax }));
  }, [chartPts.yMinDesired, chartPts.yMaxDesired, chartPts.scaleNote, chartPts.axisSuffix, chartPts.pts]);

  const Decorator = ({ x, y, data }) =>
    data.map((value, index) => (
      <Circle
        key={index}
        cx={x(index)}
        cy={y(value)}
        r={4}
        stroke={CHART_COLOR}
        fill={CHART_COLOR}
      />
    ));

  // === Resumen de registros: últimos 3 (todas las cuentas) ===
  const lastThree = useMemo(() => {
    const ids = new Set(accounts.map(a => a.id));
    let list = Array.isArray(registros) ? registros.filter(r => ids.has(r.lista_cuentas_id)) : [];
    list.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
    return list.slice(0, 3);
  }, [registros, accounts]);

  // Mapas para nombres (lista de movimientos)
  const metodosMap = useMemo(() => {
    const m = new Map();
    for (const it of metodos) m.set(it.id, it.nombre);
    return m;
  }, [metodos]);

  const subcatsMap = useMemo(() => {
    const m = new Map();
    for (const it of subcats) m.set(it.id, it.descripcion);
    return m;
  }, [subcats]);

  // Guardar/editar cuentas
  const saveAccount = async () => {
    if (!accountValid) return;
    setActionLoading(true);
    try {
      if (editingAccountId) {
        await putCuenta(editingAccountId, { nombre: accountForm.name, cantidad: accountForm.balance }, token);
      } else {
        await postCuenta({ nombre: accountForm.name, cantidad: accountForm.balance }, token);
      }
      setShowAccountForm(false);
      setLoadingAccounts(true);
      const data = await getCuentas(token);
      setAccounts(data.filter(acc => acc.usuarios_id === user.id));
    } catch {
      alert('No se pudo guardar la cuenta');
    } finally {
      setActionLoading(false);
      setLoadingAccounts(false);
      setEditingAccountId(null);
    }
  };

  const handleDeleteAccount = async (acc) => {
    setActionLoading(true);
    try {
      await deleteCuenta(acc.id, token);
      setLoadingAccounts(true);
      const data = await getCuentas(token);
      setAccounts(data.filter(a => a.usuarios_id === user.id));
    } catch {
      alert('No se pudo eliminar la cuenta');
    } finally {
      setActionLoading(false);
      setLoadingAccounts(false);
      setConfirmDeleteAcc(null);
    }
  };

  // ---------- UI del formulario de cuenta ----------
  const renderAccountForm = () => (
    <Box flex={1} bg="$white">
      {actionLoading && (
        <Box position="absolute" top={0} left={0} right={0} bottom={0} zIndex={100} bg="rgba(255,255,255,0.7)" alignItems="center" justifyContent="center">
          <Spinner size="large" color="$red600" />
          <Text mt="$3" color="$red600">Guardando...</Text>
        </Box>
      )}
      <HStack alignItems="center" justifyContent="space-between" px="$4" py="$3" borderBottomWidth={1} borderBottomColor="$coolGray100">
        <Pressable onPress={() => setShowAccountForm(false)}>
          <HStack alignItems="center" space="$1.5">
            <Icon as={MaterialIcons} name="arrow-back-ios" size="md" color="$black" />
            <Text color="$black">Regresar</Text>
          </HStack>
        </Pressable>
        <Pressable disabled={!accountValid} onPress={saveAccount} opacity={accountValid ? 1 : 0.4}>
          <Icon as={MaterialIcons} name="check" size="xl" color="$black" />
        </Pressable>
      </HStack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <VStack space="$2" mb="$2">
          <Text fontWeight="$bold" fontSize={20} color="$black">
            {editingAccountId ? 'Editar cuenta' : 'Agregar cuenta'}
          </Text>
          <Text color="$coolGray600" fontSize={12}>
            {editingAccountId ? 'Actualiza los datos de tu cuenta.' : 'Completa los datos para registrar una nueva cuenta.'}
          </Text>
        </VStack>

        {editingAccountId && (
          <VStack
            space="$1.5"
            bg="$amber100"
            borderWidth={1}
            borderColor="$amber300"
            rounded="$xl"
            p="$3"
            mb="$3"
          >
            <HStack alignItems="center" space="$2">
              <Icon as={MaterialIcons} name="warning-amber" size={18} color="$amber700" />
              <Text color="$amber800" fontWeight="$semibold">Aviso</Text>
            </HStack>
            <HStack flexWrap="wrap">
              <Text color="$amber800" fontSize="$xs">Editar el </Text>
              <Text color="$amber800" fontSize="$xs" fontWeight="$bold">saldo</Text>
              <Text color="$amber800" fontSize="$xs"> actualiza la cuenta, pero </Text>
              <Text color="$amber800" fontSize="$xs" fontWeight="$bold">no</Text>
              <Text color="$amber800" fontSize="$xs"> se registra como ingreso o gasto.</Text>
            </HStack>
          </VStack>
        )}

        <Box bg="$white" borderRadius="$xl" p="$4" borderWidth={1} borderColor="$coolGray200" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
          <VStack space="$5">
            <FormControl isInvalid={!accountForm.name.trim()}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Nombre de la cuenta</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="account-balance-wallet" /></InputSlot>
                <InputField
                  placeholder="Ej. Mi billetera, Nómina, Santander"
                  value={accountForm.name}
                  onChangeText={(v) => setAccountForm((f) => ({ ...f, name: v }))}
                />
              </Input>
              {!accountForm.name.trim() && (
                <FormControlError mt="$1">
                  <FormControlErrorText>El nombre es obligatorio.</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl isInvalid={!!accountForm.balance && !validMoney(accountForm.balance)}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Saldo inicial</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="attach-money" /></InputSlot>
                <InputField
                  placeholder="MXN 0.00"
                  keyboardType="numeric"
                  value={accountForm.balance}
                  onChangeText={(v) => setAccountForm((f) => ({ ...f, balance: v }))}
                />
              </Input>
              {!!accountForm.balance && !validMoney(accountForm.balance) && (
                <FormControlError mt="$1">
                  <FormControlErrorText>Formato inválido. Ej: 1500 o 1500.50</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <Button bg="$red600" borderRadius="$xl" h="$12" mt="$4" onPress={saveAccount} isDisabled={!accountValid} opacity={accountValid ? 1 : 0.6}>
              <ButtonText fontSize="$lg" fontWeight="$semibold" color="$white">
                {editingAccountId ? 'Guardar cambios' : 'Guardar cuenta'}
              </ButtonText>
            </Button>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );

  /* ---------- Pantalla principal ---------- */
  const renderHome = () => (
    <>
      {/* Header */}
      <HStack px="$6" py="$4" alignItems="center" justifyContent="space-between">
        <AppMenuPopover
          user={user}
          token={token}
          showPopover={showPopover}
          setShowPopover={setShowPopover}
          onMenu={onMenu}
          onStatistics={onStatistics}
          onDebts={onDebts}
          onGoals={onGoals}
          onHome={onHome}
          onBudgets={onBudgets}
          onRecurring={onRecurring}
          onLogout={onLogout}
          onProfile={onProfile}
          {...props}
        />
        <Text fontSize="$2xl" fontWeight="$bold" color="$black">Inicio</Text>
        <Pressable rounded="$full" p="$2" bg="$coolGray100" onPress={onNotifications}>
          <Icon as={MaterialIcons} name="notifications-none" size={24} color="$black" />
        </Pressable>
      </HStack>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ===== Cuentas ===== */}
        <VStack px="$6" mt="$2" space="$2">
          <HStack alignItems="center" justifyContent="space-between">
            <Text color="$coolGray600" fontSize="$sm">Cuentas</Text>
            <Button variant="outline" size="sm" borderColor="$coolGray300" bg="$white" onPress={openAccountForm}>
              <HStack space="$1" alignItems="center">
                <Icon as={MaterialIcons} name="add" size={18} color="$black" />
                <ButtonText color="$black">Agregar cuenta</ButtonText>
              </HStack>
            </Button>
          </HStack>

          {loadingAccounts ? (
            <Text color="$coolGray600" fontSize="$sm">Cargando cuentas...</Text>
          ) : !accounts.length ? (
            <Text color="$coolGray600" fontSize="$sm">No hay cuentas registradas</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24 }}>
              <HStack mt="$1">
                {accounts.map((acc, idx) => (
  <AccountCard
    key={acc.id}
    title={acc.nombre}
    amount={fmtMoney2(Number(acc.cantidad))}
    icon="wallet"
    isMenuOpen={openMenuId === acc.id}
    onOpenMenu={() => setOpenMenuId(acc.id)}
    onCloseMenu={() => setOpenMenuId(null)}
    onEdit={() => startEditAccount(acc)}
    onDelete={() => setConfirmDeleteAcc(acc)}
    shadowColor={ACCOUNT_SHADOW_COLORS[idx % ACCOUNT_SHADOW_COLORS.length]} // color dinámico
  />
))}
              </HStack>
            </ScrollView>
          )}
        </VStack>

        {/* ===== Salud financiera (KPIs) ===== */}
        <VStack px="$6" mt="$6" space="$3">
          <HStack alignItems="center" justifyContent="space-between">
            <VStack>
              <Text fontWeight="$bold" fontSize="$md" color="$black">Salud financiera</Text>
              <Text color="$coolGray500" fontSize="$xs">
                {porDias?.periodo ? porDias.periodo : 'Últimos 30 días'}
              </Text>
            </VStack>
            {(loadingCharts || loadingRegistros) && (
              <HStack space="$1" alignItems="center">
                <Spinner size="small" />
                <Text color="$coolGray500" fontSize="$xs">Actualizando…</Text>
              </HStack>
            )}
          </HStack>

          {/* KPIs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24 }}>
            <HStack mt="$1">
              <KpiCard
                label="Saldo total"
                value={fmtMoney(Number(resumen?.total_saldo ?? 0))}
                delta={pct(Number(resumen?.total_saldo ?? 0) - Number(resumen?.saldo_inicial ?? 0), Math.abs(Number(resumen?.saldo_inicial ?? 0)))}
                positive={(Number(resumen?.total_saldo ?? 0) - Number(resumen?.saldo_inicial ?? 0)) >= 0}
                icon="wallet"
                info="Variación del saldo final vs el saldo inicial. (Saldo final − Saldo inicial) / Saldo inicial."
              />
              <KpiCard
                label="Gastos (mes)"
                value={fmtMoney(Number(resumen?.gastos_mes ?? 0))}
                delta={pct(Number(resumen?.gastos_mes ?? 0), Number(resumen?.ingresos_mes ?? 0))}
                positive={false}
                icon="cash-remove"
                info="Porcentaje de ingresos gastado. Gastos / Ingresos."
              />
              <KpiCard
                label="Ingresos (mes)"
                value={fmtMoney(Number(resumen?.ingresos_mes ?? 0))}
                delta={pct(Number(resumen?.ingresos_mes ?? 0), Math.abs(Number(resumen?.ingresos_mes ?? 0)) + Math.abs(Number(resumen?.gastos_mes ?? 0)))}
                positive
                icon="cash-plus"
                info="Ingresos / (Ingresos + |Gastos|)."
              />
              <KpiCard
                label="Balance (mes)"
                value={fmtMoney(Number(resumen?.ingresos_mes ?? 0) - Number(resumen?.gastos_mes ?? 0))}
                delta={pct(Number(resumen?.ingresos_mes ?? 0) - Number(resumen?.gastos_mes ?? 0), Math.abs(Number(resumen?.ingresos_mes ?? 0)) + Math.abs(Number(resumen?.gastos_mes ?? 0)))}
                positive={(Number(resumen?.ingresos_mes ?? 0) - Number(resumen?.gastos_mes ?? 0)) >= 0}
                icon="trending-up"
                info="Eficiencia neta. (Ingresos − Gastos) / (Ingresos + |Gastos|)."
              />
            </HStack>
          </ScrollView>

          {/* ===== ÚNICA GRÁFICA: últimos 5 registros (todas las cuentas) ===== */}
          <Box
            bg="$white"
            borderRadius="$xl"
            p="$4"
            borderWidth={1}
            borderColor="$coolGray200"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, overflow: 'hidden' }}
          >
            <HStack justifyContent="space-between" alignItems="center" mb="$2">
              <Text color="$coolGray600" fontSize="$xs">
                {chartPts.rangoTexto || 'Últimos 5 registros · todas las cuentas'}
              </Text>
              <HStack space="$3" alignItems="center">
                {axisY.scaleNote ? (
                  <Text color="$coolGray500" fontSize="$xs">{axisY.scaleNote}</Text>
                ) : null}
                <Box w={10} h={10} borderRadius="$full" bg="$coolGray200" />
                <Text color="$coolGray600" fontSize="$xs">Últimos 5 registros</Text>
              </HStack>
            </HStack>

            <Box h={188}>
              {!chartPts.pts || chartPts.pts.length < 2 ? (
                <HStack flex={1} alignItems="center" justifyContent="center">
                  <Text color="$coolGray500" fontSize="$xs">No hay suficientes movimientos para graficar.</Text>
                </HStack>
              ) : (
                <HStack alignItems="stretch" style={{ height: 188 }}>
                  <YAxis
                    style={{ width: 34, marginRight: 8 }}
                    data={chartPts.pts}
                    min={axisY.yMin ?? chartPts.yMinDesired}
                    max={axisY.yMax ?? chartPts.yMaxDesired}
                    numberOfTicks={5}
                    contentInset={{ top: 16, bottom: 1 }}
                    svg={{ fill: '#64748b', fontSize: 10 }}
                    formatLabel={(value) =>
                      `${Number(value).toLocaleString('es-MX', { maximumFractionDigits: 1, minimumFractionDigits: 0 })}${axisY.axisSuffix || chartPts.axisSuffix}`
                    }
                  />
                  <Box flex={1}>
                    <AreaChart
                      style={{ height: 188 }}
                      data={chartPts.pts}
                      yMin={axisY.yMin ?? chartPts.yMinDesired}
                      yMax={axisY.yMax ?? chartPts.yMaxDesired}
                      contentInset={{ top: 16, bottom: 1 }}
                      curve={shape.curveMonotoneX}
                      svg={{ fill: 'url(#last5Gradient)', stroke: CHART_COLOR, strokeWidth: 2 }}
                    >
                      <Grid svg={{ strokeOpacity: 0.12 }} />
                      <Gradient color={CHART_COLOR} />
                      <Decorator />
                    </AreaChart>
                  </Box>
                </HStack>
              )}
            </Box>
          </Box>
        </VStack>

        {/* ===== Resumen de registros (últimos 3 de todas las cuentas) ===== */}
        <VStack px="$6" mt="$6" space="$3" mb="$8">
          <HStack alignItems="center" justifyContent="space-between">
            <VStack>
              <Text fontWeight="$bold" fontSize="$md" color="$black">Resumen de registros</Text>
              <Text color="$coolGray500" fontSize="$xs">Últimos 3 movimientos · todas las cuentas</Text>
            </VStack>
            <Button variant="outline" size="sm" bg="$white" borderColor="$coolGray300" onPress={onMenu}>
              <ButtonText color="$black">Ver todo</ButtonText>
            </Button>
          </HStack>

          {loadingRegistros ? (
            <Text color="$coolGray500" fontSize="$xs">Cargando movimientos…</Text>
          ) : lastThree.length === 0 ? (
            <Text color="$coolGray500" fontSize="$xs">No hay movimientos.</Text>
          ) : (
            <VStack space="$4">
              {lastThree.map((mov) => {
                const n = Number(mov.monto || 0);
                const methodName = metodosMap.get(mov.categori_metodos_id);
                const subcatName = subcatsMap.get(mov.subCategorias_id);
                const title = methodName || subcatName || 'Registro';
                const subtitle = formatDateOnly(mov.fecha_registro);
                return (
                  <HStack
                    key={mov.id}
                    borderWidth={1}
                    borderColor="$coolGray300"
                    borderRadius="$xl"
                    p="$3"
                    alignItems="center"
                    justifyContent="space-between"
                    bg="$white"
                  >
                    <HStack space="$3" alignItems="center" flex={1}>
                      <Box w={44} h={44} borderRadius="$full" bg="$coolGray100" alignItems="center" justifyContent="center">
                        <Icon as={MaterialCommunityIcons} name="file-document-outline" size={22} color="$black" />
                      </Box>
                      <VStack flex={1}>
                        <Text fontWeight="$bold" color="$black" numberOfLines={1}>{title}</Text>
                        <Text color="$coolGray500" numberOfLines={1}>{subtitle}</Text>
                      </VStack>
                    </HStack>
                    <Text fontWeight="$semibold" color={colorBySign(n)}>
                      {moneySign(n)} {fmtMoney2(Math.abs(n))}
                    </Text>
                  </HStack>
                );
              })}
            </VStack>
          )}
        </VStack>

        <Divider bg="$coolGray200" mx="$6" />
      </ScrollView>

      {/* Modal ELIMINAR cuenta */}
      {confirmDeleteAcc && (
        <Box position="absolute" top={0} left={0} right={0} bottom={0} bg="rgba(0,0,0,0.35)" zIndex={200} alignItems="center" justifyContent="center">
          <Box w="90%" maxW={420} bg="$white" p="$4" borderRadius="$2xl" borderWidth={1} borderColor="$coolGray200">
            <VStack space="$3">
              <HStack alignItems="center" space="$2">
                <Icon as={MaterialIcons} name="warning-amber" size={22} color="$red600" />
                <Text fontWeight="$bold" fontSize="$md" color="$black">Eliminar cuenta</Text>
              </HStack>

              <HStack flexWrap="wrap">
                <Text color="$coolGray700" fontSize="$sm">¿Seguro que deseas eliminar </Text>
                <Text color="$coolGray700" fontSize="$sm" fontWeight="$bold">{confirmDeleteAcc?.nombre}</Text>
                <Text color="$coolGray700" fontSize="$sm">?</Text>
              </HStack>

              <HStack flexWrap="wrap">
                <Text color="$coolGray700" fontSize="$sm">Los registros relacionados a esta cuenta </Text>
                <Text color="$coolGray700" fontSize="$sm" fontWeight="$bold">también serán eliminados.</Text>
              </HStack>

              <HStack mt="$2" space="$2" justifyContent="flex-end">
                <Button variant="outline" borderColor="$coolGray300" bg="$white" onPress={() => setConfirmDeleteAcc(null)}>
                  <ButtonText color="$black">Cancelar</ButtonText>
                </Button>
                <Button bg="$red600" onPress={() => handleDeleteAccount(confirmDeleteAcc)}>
                  <ButtonText color="$white">Eliminar</ButtonText>
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}

      {/* FAB */}
      <Box position="absolute" bottom={32} right={24} zIndex={100}>
        <Button
          bg="$red600"
          borderRadius="$full"
          w={64}
          h={64}
          justifyContent="center"
          alignItems="center"
          onPress={onAdd}
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 8 }}
        >
          <Icon as={MaterialIcons} name="add" size={28} color="$white" />
        </Button>
      </Box>
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <Box flex={1} bg="$white">
        {showAccountForm ? renderAccountForm() : renderHome()}
      </Box>
    </SafeAreaView>
  );
}
