import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, Pressable, ScrollView, ButtonText,
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import {
  AreaChart,
  LineChart,
  Grid,
  PieChart,
  BarChart,
} from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import AppMenuPopover from '../components/AppMenuPopover';

const TABS = ['Saldo', 'Gasto', 'Panorama'];

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

const Dots = ({ x, y, data }) =>
  data.map((value, index) => (
    <Circle
      key={`dot-${index}`}
      cx={x(index)}
      cy={y(value)}
      r={4}
      stroke="#4f46e5"
      strokeWidth={2}
      fill="#fff"
    />
  ));

const Gradient = () => (
  <Defs>
    <LinearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0%" stopColor="#4f46e5" stopOpacity={0.28} />
      <Stop offset="100%" stopColor="#4f46e5" stopOpacity={0.06} />
    </LinearGradient>
  </Defs>
);

/* ===== Filtros inferiores con scroll horizontal (reutilizable) ===== */
const FILTERS = ['7 días', '30 días', '12 Semanas', '6 Meses', '…'];

function BottomFilters() {
  const [active, setActive] = React.useState(FILTERS[0]);
  return (
    <Box
      borderTopWidth={1}
      borderColor="$coolGray200"
      bg="$white"
      px="$4"
      py="$3"
      mt="$4"
      mb="$2"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        <HStack space="$2" alignItems="center">
          {FILTERS.map((label) => {
            const selected = active === label;
            return (
              <Button
                key={label}
                onPress={() => setActive(label)}
                bg={selected ? '$black' : '$white'}
                variant={selected ? 'solid' : 'outline'}
                borderColor="$coolGray300"
                borderRadius="$lg"
                minW={120}
                h={44}
                px="$4"
                justifyContent="center"
                alignItems="center"
              >
                <ButtonText color={selected ? '$white' : '$black'} fontWeight="$bold">
                  {label}
                </ButtonText>
              </Button>
            );
          })}
        </HStack>
      </ScrollView>
    </Box>
  );
}

export default function StatisticsScreen({
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
  const [tab, setTab] = useState('Saldo');
  const [showPopover, setShowPopover] = useState(false);

  const saldoData = useMemo(() => [40, 52, 37, 61, 45, 58, 49, 66, 59, 72], []);
  const tendenciaData = useMemo(() => [10, 0, 0, 40, 0, 0, 22], []);
  const pagosData = useMemo(() => [0, 0, 0, 0, 0, 0, 500], []);
  const donutData = useMemo(
    () => [
      { key: 'com', value: 60, svg: { fill: '#5B5BF6' }, label: 'Comunicaciones, PC' },
      { key: 'veh', value: 25, svg: { fill: '#A259F7' }, label: 'Vehículos' },
      { key: 'tra', value: 15, svg: { fill: '#F76B5B' }, label: 'Transporte' },
    ],
    []
  );

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
  onProfile={onProfile} // <-- AGREGA ESTA LÍNEA
/>
          <Text fontSize="$2xl" fontWeight="$bold" color="$black">Estadísticas</Text>
          <Pressable rounded="$full" p="$2" bg="$coolGray100" onPress={onNotifications}>
            <Icon as={MaterialIcons} name="notifications-none" size={24} color="$black" />
          </Pressable>
        </HStack>

        {/* Tabs */}
        <HStack px="$3" py="$2" space="$2" justifyContent="center" alignItems="center">
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

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {/* ===== TAB SALDO ===== */}
          {tab === 'Saldo' && (
            <VStack space="$4">
              <Card mb="$4">
                <HStack justifyContent="space-between" alignItems="flex-start" mb="$1">
                  <VStack>
                    <Text fontWeight="$bold" fontSize="$md" color="$black">
                      Tendencia del saldo
                    </Text>
                    <Text color="$coolGray500" fontSize="$xs">Gráfica de tu dinero</Text>
                  </VStack>
                  <Text fontWeight="$bold" fontSize="$md" color="$red600">-35%</Text>
                </HStack>

                <HStack alignItems="center" justifyContent="space-between" mt="$2" mb="$1">
                  <Text color="$black" fontWeight="$bold">Últimos 30 días</Text>
                  <Button variant="outline" size="xs" borderRadius="$md" px="$2">
                    <ButtonText color="$black" fontSize="$xs">Mes</ButtonText>
                  </Button>
                </HStack>

                <Text fontWeight="$bold" fontSize="$xl" color="$black">MXN 2,982</Text>

                <Box h={140} mt="$2">
                  <AreaChart
                    style={{ height: 140 }}
                    data={saldoData}
                    contentInset={{ top: 20, bottom: 20 }}
                    curve={shape.curveMonotoneX}
                    svg={{ fill: 'url(#gradBlue)' }}
                  >
                    <Grid svg={{ strokeOpacity: 0.1 }} />
                    <Gradient />
                  </AreaChart>

                  <LineChart
                    style={{ height: 140, position: 'absolute', left: 0, right: 0 }}
                    data={saldoData}
                    contentInset={{ top: 20, bottom: 20 }}
                    curve={shape.curveMonotoneX}
                    svg={{ stroke: '#4f46e5', strokeWidth: 2 }}
                  >
                    <Dots />
                  </LineChart>
                </Box>
              </Card>

              <Card mb="$4">
                <Text fontWeight="$bold" fontSize="$md" color="$black" mb="$2">
                  Saldo por cuentas
                </Text>
                <Text fontWeight="$bold" fontSize="$xl" color="$black">MXN 5,000.00</Text>
                <Box bg="$coolGray200" h={32} borderRadius="$md" mt="$2" mb="$1" w="100%">
                  <Box bg="$black" h="100%" borderRadius="$md" w="60%" />
                </Box>
                <HStack justifyContent="space-between">
                  <Text color="$coolGray600">Efectivo</Text>
                  <Text color="$coolGray600">Cuenta</Text>
                </HStack>
              </Card>
            </VStack>
          )}

          {/* ===== TAB GASTO ===== */}
          {tab === 'Gasto' && (
            <VStack space="$4">
              <Card mb="$4">
                <Text fontWeight="$bold" fontSize="$md" color="$black">
                  Gastos por categoría
                </Text>
                <Text color="$coolGray500" fontSize="$xs" mb="$2">¿En qué se divide?</Text>

                <HStack alignItems="center" justifyContent="space-between" mb="$2">
                  <Text color="$black" fontWeight="$bold">ÚLTIMOS 7 DÍAS</Text>
                  <HStack space="$2">
                    <Button variant="outline" size="xs" borderRadius="$md" px="$2">
                      <ButtonText color="$black" fontSize="$xs">Categorías</ButtonText>
                    </Button>
                    <Button variant="outline" size="xs" borderRadius="$md" px="$2">
                      <ButtonText color="$black" fontSize="$xs">Etiquetas</ButtonText>
                    </Button>
                  </HStack>
                </HStack>

                <Text fontWeight="$bold" fontSize="$xl" color="$black">MXN 1,750.00</Text>

                <Box alignItems="center" justifyContent="center" mt="$2" mb="$3">
                  <PieChart
                    style={{ height: 190, width: 190 }}
                    data={donutData}
                    innerRadius={60}
                    padAngle={0.02}
                    sort={() => 0}
                  />
                  <Box position="absolute" top={70} left={0} right={0} alignItems="center">
                    <Text fontWeight="$bold" fontSize="$md" color="$black">Todos</Text>
                    <Text fontWeight="$bold" fontSize="$md" color="$black">MXN 1,750</Text>
                  </Box>
                </Box>

                <HStack space="$4" justifyContent="center" alignItems="center">
                  {donutData.map((d) => (
                    <HStack key={d.key} alignItems="center" space="$1">
                      <Box w={12} h={12} bg={d.svg.fill} borderRadius="$full" />
                      <Text fontSize="$xs">{d.label}</Text>
                    </HStack>
                  ))}
                </HStack>

                <Text fontWeight="$bold" fontSize="$md" color="$black" mt="$4">TENDENCIA</Text>
                <Box h={100} mt="$2">
                  <AreaChart
                    style={{ height: 100 }}
                    data={tendenciaData}
                    svg={{ fill: 'url(#gradBlue)' }}
                    curve={shape.curveMonotoneX}
                    contentInset={{ top: 15, bottom: 15 }}
                  >
                    <Grid svg={{ strokeOpacity: 0.1 }} />
                    <Gradient />
                  </AreaChart>
                  <LineChart
                    style={{ height: 100, position: 'absolute', left: 0, right: 0 }}
                    data={tendenciaData}
                    svg={{ stroke: '#4f46e5', strokeWidth: 2 }}
                    curve={shape.curveMonotoneX}
                    contentInset={{ top: 15, bottom: 15 }}
                  >
                    <Dots />
                  </LineChart>
                </Box>
              </Card>
            </VStack>
          )}

          {/* ===== TAB PANORAMA ===== */}
          {tab === 'Panorama' && (
            <VStack space="$4">
              <Card mb="$4">
                <Text fontWeight="$bold" fontSize="$md" color="$black">
                  Pagos Planificados
                </Text>
                <Text color="$coolGray500" fontSize="$xs" mb="$2">Pagos próximos</Text>

                <Text fontWeight="$bold" fontSize="$xs" color="$black">PRÓXIMOS 7 DÍAS</Text>
                <Text fontWeight="$bold" fontSize="$xl" color="$black">MXN 500.00</Text>

                <VStack space="$3" mt="$3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <VStack key={i} space="$1">
                      <HStack justifyContent="space-between">
                        <Text color="$black">Supermercados</Text>
                        <Text color="$black">MXN 500.00</Text>
                      </HStack>
                      <Box bg="$coolGray200" h={8} borderRadius="$md" w="100%">
                        <Box bg="#5B5BF6" h="100%" borderRadius="$md" w="80%" />
                      </Box>
                    </VStack>
                  ))}
                </VStack>
              </Card>

              <Card mb="$4">
                <Text fontWeight="$bold" fontSize="$md" color="$black">Cronograma</Text>
                <Text color="$coolGray500" fontSize="$xs" mb="$2">Pagos en los próximos días</Text>
                <Text fontWeight="$bold" fontSize="$xs" color="$black">PRÓXIMOS 7 DÍAS</Text>
                <Text fontWeight="$bold" fontSize="$xl" color="$black">MXN 500.00</Text>

                <Box h={110} mt="$2">
                  <BarChart
                    style={{ height: 110 }}
                    data={pagosData}
                    svg={{ fill: '#F76B5B' }}
                    contentInset={{ top: 10, bottom: 10 }}
                    spacingInner={0.4}
                    gridMin={0}
                  />
                </Box>
                <HStack justifyContent="space-between" mt="$1">
                  <Text fontSize="$xs" color="$coolGray400">Hoy</Text>
                  <Text fontSize="$xs" color="$coolGray400">1 jun</Text>
                  <Text fontSize="$xs" color="$coolGray400">4 jun</Text>
                </HStack>
              </Card>
            </VStack>
          )}

          {/* 👇 Filtros inferiores horizontales (reemplaza las “paginaciones” anteriores) */}
          <BottomFilters />
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
