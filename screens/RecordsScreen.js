import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, ScrollView, Pressable, ButtonText, Divider, Badge, BadgeText
} from '@gluestack-ui/themed';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AppMenuPopover from '../components/AppMenuPopover';

const recordsData = [
  {
    date: 'Hoy',
    hour: '2:48 pm',
    total: '-MXN 128.50',
    totalColor: '$red600',
    saldo: 'MXN 5,000.00',
    items: [
      { icon: 'silverware-fork-knife', category: 'Alimentos', account: 'Efectivo', amount: '-MXN 1,000.00', selected: true },
      { icon: 'receipt', category: 'Servicios', account: 'Efectivo', amount: '-MXN 2,000.00' },
      { icon: 'bus', category: 'Transporte', account: 'Efectivo', amount: '-MXN 300.00' },
    ]
  },
  {
    date: '25 Mayo',
    total: '-MXN 1,280.50',
    totalColor: '$red600',
    saldo: 'MXN 5,000.00',
    items: [
      { icon: 'silverware-fork-knife', category: 'Alimentos', account: 'Efectivo', amount: '-MXN 500.00' },
      { icon: 'receipt', category: 'Servicios', account: 'Efectivo', amount: '-MXN 700.50' },
      { icon: 'bus', category: 'Transporte', account: 'Efectivo', amount: '-MXN 80.00' },
    ]
  }
];

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
      mt="$2"
      mb="$4"
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
                minW={110}
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

export default function RecordsScreen({
  onAdd = () => {},
  onMenu = () => {},
  onStatistics = () => {},
  onDebts = () => {},
  onGoals = () => {},
  onHome = () => {},
  onNotifications = () => {},
  onLogout = () => {},
  onBudgets = () => {},
  onRecurring = () => {},
}) {
  const [showPopover, setShowPopover] = React.useState(false);

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
          borderBottomColor="$coolGray100"
        >
          <AppMenuPopover
            showPopover={showPopover}
            setShowPopover={setShowPopover}
            onHome={onHome}
            onMenu={onMenu}
            onStatistics={onStatistics}
            onDebts={onDebts}
            onGoals={onGoals}
            onBudgets={onBudgets}      // <-- CORRECTO
            onRecurring={onRecurring}  // <-- CORRECTO
            onLogout={onLogout}
          />
          <Text fontSize={24} fontWeight="$bold" color="$black">
            Registros
          </Text>
          <Pressable rounded="$full" p="$2" bg="$coolGray100" onPress={onNotifications}>
            <Icon as={MaterialIcons} name="notifications-none" size={24} color="$black" />
          </Pressable>
        </HStack>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {recordsData.map((section, idx) => (
            <Box key={idx} px="$4" mt={idx === 0 ? "$3" : "$2"}>
              {/* Encabezado del día */}
              <HStack alignItems="center" justifyContent="space-between" mb="$1">
                <HStack alignItems="center" space="$2">
                  <Text fontWeight="$bold" fontSize={18} color="$black">{section.date}</Text>
                  {section.hour && (
                    <Badge action="muted" borderRadius="$md" px="$2" py="$1" bg="$coolGray100">
                      <BadgeText color="$coolGray600">{section.hour}</BadgeText>
                    </Badge>
                  )}
                </HStack>
                <Text fontWeight="$bold" fontSize={18} color={section.totalColor}>{section.total}</Text>
              </HStack>
              {section.saldo && (
                <Text color="$coolGray500" fontSize={12} mb="$2">Saldo {section.saldo}</Text>
              )}

              {/* Tarjeta del día */}
              <Box
                bg="$white"
                borderRadius="$xl"
                borderWidth={1}
                borderColor="$coolGray200"
                overflow="hidden"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 2,
                }}
              >
                {section.items.map((item, i) => (
                  <React.Fragment key={i}>
                    <Pressable>
                      <HStack
                        px="$4"
                        py="$3"
                        alignItems="center"
                        justifyContent="space-between"
                        bg="$white"
                        borderLeftWidth={item.selected ? 3 : 0}
                        borderLeftColor={item.selected ? '$black' : '$white'}
                      >
                        <HStack space="$3" alignItems="center" flex={1}>
                          {/* Icono redondo */}
                          <Box
                            w={40}
                            h={40}
                            borderRadius="$full"
                            bg="$coolGray100"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Icon as={MaterialCommunityIcons} name={item.icon} size={20} color="$black" />
                          </Box>

                          <VStack flex={1}>
                            <Text fontWeight="$bold" color="$black">{item.category}</Text>
                            <Text color="$coolGray500" numberOfLines={1}>
                              {item.account}
                            </Text>
                          </VStack>

                          <HStack alignItems="center" space="$1">
                            <Text color="$black" fontWeight="$bold">{item.amount}</Text>
                            <Icon as={MaterialIcons} name="chevron-right" size={20} color="$coolGray400" />
                          </HStack>
                        </HStack>
                      </HStack>
                    </Pressable>
                    {i < section.items.length - 1 && <Divider mx="$4" bg="$coolGray200" />}
                  </React.Fragment>
                ))}
              </Box>
            </Box>
          ))}

          {/* Filtros inferiores */}
          <BottomFilters />
        </ScrollView>

        {/* FAB */}
        <Box position="absolute" bottom={32} right={24}>
          <Button
            bg="$red600"
            borderRadius="$full"
            w={60}
            h={60}
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
      </Box>
    </SafeAreaView>
  );
}
