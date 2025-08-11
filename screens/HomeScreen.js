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
import { AreaChart, Grid } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import AppMenuPopover from '../components/AppMenuPopover';
import {
  getCuentas, postCuenta, putCuenta, deleteCuenta,
  getGraficoResumen, getGraficoPorDias, getGraficoCuentas,
  getRegistros, getMetodos, getSubcategorias,
} from '../api';

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
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
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

/** ---------- Gradiente gráfico ---------- */
const Gradient = () => (
  <Defs>
    <LinearGradient id="homeGradient" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
      <Stop offset="100%" stopColor="#4f46e5" stopOpacity={0.06} />
    </LinearGradient>
  </Defs>
);

// ===== Helpers =====
const fmtMoney = (n) => (typeof n === 'number' && !isNaN(n) ? `MXN ${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}` : '—');
const fmtMoney2 = (n) => (typeof n === 'number' && !isNaN(n) ? `MXN ${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—');
const pct = (num, den) => {
  if (!isFinite(num) || !isFinite(den) || Math.abs(den) < 1e-9) return '—';
  const r = Math.round((num / den) * 1000) / 10; // 1 decimal
  return `${r >= 0 ? '+' : ''}${r}%`;
};
const moneySign = (n) => (n < 0 ? '-' : '+');
const colorBySign = (n) => (n < 0 ? '$red600' : '$green600');
const formatSigned = (n) => `${moneySign(n)} ${fmtMoney2(Math.abs(n))}`;
const formatDateOnly = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' });
  } catch {
    return String(iso).split('T')[0] || '—';
  }
};

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

  // Analíticas
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

  // ====== Cálculos analíticos ======
  const analytics = useMemo(() => {
    const ingresosMes = Number(resumen?.ingresos_mes ?? 0);
    const gastosMes = Number(resumen?.gastos_mes ?? 0);
    const totalSaldo = Number(resumen?.total_saldo ?? 0);

    const diarios = Array.isArray(porDias?.resumen_diario) ? [...porDias.resumen_diario] : [];
    diarios.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    const deltaPeriodo = diarios.reduce((acc, d) => acc + (Number(d.ingresos ?? 0) - Number(d.gastos ?? 0)), 0);

    const saldoInicio = totalSaldo - deltaPeriodo;

    const movs = Array.isArray(porDias?.movimientos_individuales) ? [...porDias.movimientos_individuales] : [];
    movs.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    let running = saldoInicio;
    const serieSaldo = [running];
    for (const m of movs) {
      const monto = Number(m.monto ?? 0);
      running += Number.isFinite(monto) ? monto : 0;
      serieSaldo.push(running);
    }
    if (serieSaldo.length < 2) serieSaldo.push(totalSaldo);

    const totalMovs = Math.abs(ingresosMes) + Math.abs(gastosMes);
    const saldoDeltaPct = pct(totalSaldo - saldoInicio, Math.abs(saldoInicio));
    const burnRatePct = pct(gastosMes, ingresosMes);
    const ingresosSharePct = pct(ingresosMes, totalMovs);
    const balancePct = pct(ingresosMes - gastosMes, totalMovs);

    return {
      serieSaldo,
      rangoTexto: (porDias?.fecha_inicio && porDias?.fecha_fin)
        ? `${porDias.fecha_inicio} → ${porDias.fecha_fin}`
        : 'Últimos 30 días',
      kpis: {
        saldo: {
          value: fmtMoney(totalSaldo),
          delta: saldoDeltaPct,
          positive: (totalSaldo - saldoInicio) >= 0,
          info: 'Variación del saldo final vs el saldo al inicio del periodo. Fórmula: (Saldo final − Saldo inicial) / Saldo inicial.'
        },
        gastos: {
          value: fmtMoney(gastosMes),
          delta: burnRatePct,
          positive: false,
          info: 'Burn rate del periodo. ¿Qué porcentaje de los ingresos se gastó? Fórmula: Gastos / Ingresos. Si Ingresos = 0 → “—”.'
        },
        ingresos: {
          value: fmtMoney(ingresosMes),
          delta: ingresosSharePct,
          positive: true,
          info: 'Participación de ingresos sobre el total de movimientos. Fórmula: Ingresos / (Ingresos + |Gastos|).'
        },
        balance: {
          value: fmtMoney(ingresosMes - gastosMes),
          delta: balancePct,
          positive: (ingresosMes - gastosMes) >= 0,
          info: 'Eficiencia neta del periodo. Fórmula: (Ingresos − Gastos) / (Ingresos + |Gastos|).'
        },
      }
    };
  }, [resumen, porDias]);

  // === Mapas para nombres ===
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

  // === Derivados de “Resumen de registros” ===
  const activeAccountId = accounts?.[0]?.id; // por ahora, primera cuenta
  const lastTwo = useMemo(() => {
    if (!Array.isArray(registros) || !activeAccountId) return [];
    const filtered = registros.filter(r => r.lista_cuentas_id === activeAccountId);
    filtered.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
    return filtered.slice(0, 2);
  }, [registros, activeAccountId]);

  const accountNameById = useMemo(() => {
    const map = new Map();
    for (const a of accounts) map.set(a.id, a.nombre);
    return map;
  }, [accounts]);

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

        {/* Aviso EDITAR saldo: sin textos sueltos dentro de contenedores */}
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

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
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
                {accounts.map(acc => (
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
                  />
                ))}
              </HStack>
            </ScrollView>
          )}

          {actionLoading && (
            <Box position="absolute" top={0} left={0} right={0} bottom={0} zIndex={100} bg="rgba(255,255,255,0.7)" alignItems="center" justifyContent="center">
              <Spinner size="large" color="$red600" />
              <Text mt="$3" color="$red600">Procesando...</Text>
            </Box>
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
            {loadingCharts && (
              <HStack space="$1" alignItems="center">
                <Spinner size="small" />
                <Text color="$coolGray500" fontSize="$xs">Actualizando…</Text>
              </HStack>
            )}
          </HStack>

          {/* KPIs con explicación */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24 }}>
            <HStack mt="$1">
              <KpiCard
                label="Saldo total"
                value={analytics.kpis.saldo.value}
                delta={analytics.kpis.saldo.delta}
                positive={analytics.kpis.saldo.positive}
                icon="wallet"
                info={analytics.kpis.saldo.info}
              />
              <KpiCard
                label="Gastos (mes)"
                value={analytics.kpis.gastos.value}
                delta={analytics.kpis.gastos.delta}
                positive={false}
                icon="cash-remove"
                info={analytics.kpis.gastos.info}
              />
              <KpiCard
                label="Ingresos (mes)"
                value={analytics.kpis.ingresos.value}
                delta={analytics.kpis.ingresos.delta}
                positive
                icon="cash-plus"
                info={analytics.kpis.ingresos.info}
              />
              <KpiCard
                label="Balance (mes)"
                value={analytics.kpis.balance.value}
                delta={analytics.kpis.balance.delta}
                positive={analytics.kpis.balance.positive}
                icon="trending-up"
                info={analytics.kpis.balance.info}
              />
            </HStack>
          </ScrollView>

          {/* Gráfica */}
          <Box
            bg="$white"
            borderRadius="$xl"
            p="$4"
            borderWidth={1}
            borderColor="$coolGray200"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, overflow: 'hidden' }}
          >
            <HStack justifyContent="space-between" alignItems="center" mb="$2">
              <Text color="$coolGray600" fontSize="$xs">{analytics.rangoTexto}</Text>
              <HStack space="$2" alignItems="center">
                <Box w={10} h={10} borderRadius="$full" bg="$coolGray200" />
                <Text color="$coolGray600" fontSize="$xs">Tendencia</Text>
              </HStack>
            </HStack>

            <Box h={188}>
              <AreaChart
                style={{ height: 188 }}
                data={analytics.serieSaldo}
                contentInset={{ top: 20, bottom: 20 }}
                curve={analytics.serieSaldo.length < 3 ? shape.curveLinear : shape.curveMonotoneX}
                svg={{ fill: 'url(#homeGradient)', stroke: '#4f46e5', strokeWidth: 2 }}
              >
                <Grid svg={{ strokeOpacity: 0.12 }} />
                <Gradient />
              </AreaChart>
            </Box>
          </Box>
        </VStack>

        {/* ===== Resumen de registros (últimos 2) ===== */}
        <VStack px="$6" mt="$6" space="$3" mb="$8">
          <HStack alignItems="center" justifyContent="space-between">
            <VStack>
              <Text fontWeight="$bold" fontSize="$md" color="$black">Resumen de registros</Text>
              <Text color="$coolGray500" fontSize="$xs">
                {accounts?.[0]?.id
                  ? `Últimos 2 movimientos · ${accountNameById.get(accounts[0].id) || 'Cuenta'}`
                  : 'Sin cuenta seleccionada'}
              </Text>
            </VStack>
            <Button variant="outline" size="sm" bg="$white" borderColor="$coolGray300" onPress={onMenu}>
              <ButtonText color="$black">Ver todo</ButtonText>
            </Button>
          </HStack>

          {loadingRegistros ? (
            <Text color="$coolGray500" fontSize="$xs">Cargando movimientos…</Text>
          ) : lastTwo.length === 0 ? (
            <Text color="$coolGray500" fontSize="$xs">No hay movimientos para esta cuenta.</Text>
          ) : (
            <VStack space="$4">
              {lastTwo.map((mov) => {
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
                      {formatSigned(n)}
                    </Text>
                  </HStack>
                );
              })}
            </VStack>
          )}
        </VStack>

        <Divider bg="$coolGray200" mx="$6" />
      </ScrollView>

      {/* Modal ELIMINAR cuenta: sin strings sueltos */}
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
