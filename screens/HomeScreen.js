import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, ScrollView, Pressable, ButtonText, Divider,
  Input, InputField, InputIcon, InputSlot,
  FormControl, FormControlLabel, FormControlLabelText, FormControlError, FormControlErrorText,
  Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectItem,
} from '@gluestack-ui/themed';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { AreaChart, Grid } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import AppMenuPopover from '../components/AppMenuPopover';

/** ---------- Tarjeta KPI scrolleable ---------- */
const KpiCard = ({ label, value, delta, positive, icon = 'chart-line' }) => (
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
      <Text color="$coolGray600" fontSize="$xs" numberOfLines={1}>{label}</Text>
      <Icon as={MaterialCommunityIcons} name={icon} size={18} color="$coolGray500" />
    </HStack>

    <HStack alignItems="baseline" space="$2" mt="$2">
      <Text color="$black" fontSize="$xl" fontWeight="$bold" numberOfLines={1}>{value}</Text>
      {typeof delta === 'string' && (
        <Text color={positive ? '$green600' : '$red600'} fontSize="$xs" numberOfLines={1}>
          {positive ? '▲' : '▼'} {delta}
        </Text>
      )}
    </HStack>
  </Box>
);

/** ---------- Card de cuenta ---------- */
const AccountCard = ({ title, amount, bg = '$white', color = '$black', icon = 'wallet' }) => (
  <Box
    bg={bg}
    borderRadius="$xl"
    p="$4"
    borderWidth={1}
    borderColor="$coolGray200"
    mr="$3"
    minW={180}
    style={{
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    }}
  >
    <HStack alignItems="center" justifyContent="space-between">
      <Text color={color} fontSize="$sm" fontWeight="$semibold" numberOfLines={1}>
        {title}
      </Text>
      <Icon as={MaterialCommunityIcons} name={icon} size={22} color={color} />
    </HStack>
    <Text mt="$3" color={color} fontSize="$xl" fontWeight="$bold" numberOfLines={1}>
      {amount}
    </Text>
  </Box>
);

/** ---------- Gradiente de la gráfica ---------- */
const Gradient = () => (
  <Defs>
    <LinearGradient id="homeGradient" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
      <Stop offset="100%" stopColor="#4f46e5" stopOpacity={0.06} />
    </LinearGradient>
  </Defs>
);

const ACCOUNT_TYPES = [
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Cuenta bancaria', value: 'cuenta' },
  { label: 'Ahorros', value: 'ahorros' },
  { label: 'Tarjeta de débito', value: 'debito' },
];

export default function HomeScreen({
  onAdd, onMenu, onStatistics, onDebts, onGoals, onHome, onNotifications, onBudgets, onRecurring, onLogout
}) {
  const data = useMemo(() => [40, 55, 35, 60, 45, 50, 65, 52, 70, 62, 75, 68], []);
  const [showPopover, setShowPopover] = useState(false);

  // ------ Estado del formulario de cuenta ------
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: '',
    balance: '',
  });

  const validMoney = (v) => /^(\d+)([.,]\d{1,2})?$/.test(String(v).replace(',', '.'));
  const accountValid = accountForm.name.trim() && accountForm.type && validMoney(accountForm.balance);

  const openAccountForm = () => {
    setAccountForm({ name: '', type: '', balance: '' });
    setShowAccountForm(true);
  };
  const saveAccount = () => {
    if (!accountValid) return;
    // aquí guardarías la cuenta (backend/estado global)
    setShowAccountForm(false);
  };

  // ---------- UI del formulario de cuenta ----------
  const renderAccountForm = () => (
    <Box flex={1} bg="$white">
      {/* Header del formulario */}
      <HStack
        alignItems="center"
        justifyContent="space-between"
        px="$4"
        py="$3"
        borderBottomWidth={1}
        borderBottomColor="$coolGray100"
      >
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
          <Text fontWeight="$bold" fontSize={20} color="$black">Agregar cuenta</Text>
          <Text color="$coolGray600" fontSize={12}>Completa los datos para registrar una nueva cuenta.</Text>
        </VStack>

        <Box
          bg="$white"
          borderRadius="$xl"
          p="$4"
          borderWidth={1}
          borderColor="$coolGray200"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <VStack space="$5">
            {/* Nombre de la cuenta */}
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

            {/* Tipo de cuenta */}
            <FormControl isInvalid={!accountForm.type}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Tipo de cuenta</FormControlLabelText>
              </FormControlLabel>

              <Select
                selectedValue={accountForm.type}
                onValueChange={(v) => setAccountForm((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger borderColor="$coolGray300" bg="$white">
                  <SelectInput placeholder="Selecciona un tipo" />
                  <SelectIcon as={MaterialIcons} name="expand-more" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} label={t.label} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>

              {!accountForm.type && (
                <FormControlError mt="$1">
                  <FormControlErrorText>Selecciona el tipo de cuenta.</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Saldo inicial */}
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

            <Button
              bg="$red600"
              borderRadius="$xl"
              h="$12"
              mt="$4"
              onPress={saveAccount}
              isDisabled={!accountValid}
              opacity={accountValid ? 1 : 0.6}
            >
              <ButtonText fontSize="$lg" fontWeight="$semibold" color="$white">Guardar cuenta</ButtonText>
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
            <Button
              variant="outline"
              size="sm"
              borderColor="$coolGray300"
              bg="$white"
              onPress={openAccountForm}
            >
              <HStack space="$1" alignItems="center">
                <Icon as={MaterialIcons} name="add" size={18} color="$black" />
                <ButtonText color="$black">Agregar cuenta</ButtonText>
              </HStack>
            </Button>
          </HStack>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24 }}>
            <HStack mt="$1">
              <AccountCard title="Efectivo" amount="MXN 5,000" bg="$black" color="$white" icon="cash" />
              <AccountCard title="Cuenta" amount="MXN 10,000" icon="credit-card-outline" />
              <AccountCard title="Ahorros" amount="MXN 25,300" icon="bank-outline" />
            </HStack>
          </ScrollView>
        </VStack>

        {/* ===== Salud financiera ===== */}
        <VStack px="$6" mt="$6" space="$3">
          <HStack alignItems="center" justifyContent="space-between">
            <VStack>
              <Text fontWeight="$bold" fontSize="$md" color="$black">Salud financiera</Text>
              <Text color="$coolGray500" fontSize="$xs">Visión rápida de tus números</Text>
            </VStack>
            <Button variant="outline" size="sm" bg="$white" borderColor="$coolGray300">
              <HStack space="$1" alignItems="center">
                <Text color="$black" fontSize="$sm">Mes</Text>
                <Icon as={MaterialIcons} name="expand-more" size={18} color="$black" />
              </HStack>
            </Button>
          </HStack>

          {/* KPIs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24 }}>
            <HStack mt="$1">
              <KpiCard label="Saldo total" value="MXN 40,300" delta="1.8%" positive icon="wallet" />
              <KpiCard label="Gasto (30d)" value="MXN 2,982" delta="−3.1%" positive={false} icon="cash-remove" />
              <KpiCard label="Ingresos (30d)" value="MXN 5,500" delta="2.4%" positive icon="cash-plus" />
              <KpiCard label="Ahorro meta" value="MXN 12,000" delta="75% cumplido" positive icon="target" />
              <KpiCard label="Variación mensual" value="+MXN 820" delta="vs. mes previo" positive icon="trending-up" />
            </HStack>
          </ScrollView>

          {/* Gráfica */}
          <Box
            bg="$white"
            borderRadius="$xl"
            p="$4"
            borderWidth={1}
            borderColor="$coolGray200"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
              overflow: 'hidden',
            }}
          >
            <HStack justifyContent="space-between" alignItems="center" mb="$2">
              <Text color="$coolGray600" fontSize="$xs">Últimos 12 puntos</Text>
              <HStack space="$2" alignItems="center">
                <Box w={10} h={10} borderRadius="$full" bg="$coolGray200" />
                <Text color="$coolGray600" fontSize="$xs">Tendencia</Text>
              </HStack>
            </HStack>

            <Box h={188}>
              <AreaChart
                style={{ height: 188 }}
                data={data}
                contentInset={{ top: 20, bottom: 20 }}
                curve={shape.curveMonotoneX}
                svg={{ fill: 'url(#homeGradient)', stroke: '#4f46e5', strokeWidth: 2 }}
              >
                <Grid svg={{ strokeOpacity: 0.12 }} />
                <Gradient />
              </AreaChart>
            </Box>
          </Box>
        </VStack>

        {/* ===== Resumen de registros ===== */}
        <VStack px="$6" mt="$6" space="$3" mb="$8">
          <HStack alignItems="center" justifyContent="space-between">
            <VStack>
              <Text fontWeight="$bold" fontSize="$md" color="$black">Resumen de registros</Text>
              <Text color="$coolGray500" fontSize="$xs">Últimos 30 días</Text>
            </VStack>
            <Button variant="outline" size="sm" bg="$white" borderColor="$coolGray300" onPress={onMenu}>
              <ButtonText color="$black">Ver todo</ButtonText>
            </Button>
          </HStack>

          <VStack space="$2">
            <HStack
              borderWidth={1}
              borderColor="$coolGray300"
              borderRadius="$xl"
              p="$3"
              alignItems="center"
              justifyContent="space-between"
              bg="$white"
            >
              <HStack space="$3" alignItems="center" flex={1}>
                <Box w={40} h={40} borderRadius="$full" bg="$coolGray100" alignItems="center" justifyContent="center">
                  <Icon as={MaterialCommunityIcons} name="silverware-fork-knife" size={20} color="$black" />
                </Box>
                <VStack flex={1}>
                  <Text fontWeight="$bold" color="$black" numberOfLines={1}>Alimentos</Text>
                  <Text color="$coolGray500" numberOfLines={1}>Efectivo · -MXN 1,000.00</Text>
                </VStack>
              </HStack>
              <Icon as={MaterialIcons} name="chevron-right" size={22} color="$coolGray400" />
            </HStack>

            <HStack
              borderWidth={1}
              borderColor="$coolGray300"
              borderRadius="$xl"
              p="$3"
              alignItems="center"
              justifyContent="space-between"
              bg="$white"
            >
              <HStack space="$3" alignItems="center" flex={1}>
                <Box w={40} h={40} borderRadius="$full" bg="$coolGray100" alignItems="center" justifyContent="center">
                  <Icon as={MaterialCommunityIcons} name="receipt" size={20} color="$black" />
                </Box>
                <VStack flex={1}>
                  <Text fontWeight="$bold" color="$black" numberOfLines={1}>Servicios</Text>
                  <Text color="$coolGray500" numberOfLines={1}>Efectivo · -MXN 2,000.00</Text>
                </VStack>
              </HStack>
              <Icon as={MaterialIcons} name="chevron-right" size={22} color="$coolGray400" />
            </HStack>
          </VStack>
        </VStack>

        <Divider bg="$coolGray200" mx="$6" />
      </ScrollView>

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
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 8,
          }}
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
