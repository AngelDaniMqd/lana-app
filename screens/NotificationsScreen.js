import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Icon, Pressable
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';

export default function NotificationsScreen({
  onBack = () => {},
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
          <Pressable
            onPress={onBack}
            rounded="$full"
            p="$2"
            bg="$coolGray100"
          >
            <Icon as={MaterialIcons} name="chevron-left" size={24} color="$black" />
          </Pressable>

          <Text fontSize="$xl" fontWeight="$bold" color="$black">
            Notificaciones
          </Text>

          {/* Espaciador para simetría */}
          <Box w={32} />
        </HStack>

        {/* Notificación simulada */}
        <VStack px="$6" mt="$8" space="$4">
          <Box
            bg="$yellow100"
            borderRadius="$xl"
            p="$4"
            borderWidth={1}
            borderColor="$yellow300"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
            <HStack alignItems="center" space="$3">
              <Icon as={MaterialIcons} name="notifications-active" size={28} color="$yellow700" />
              <VStack flex={1}>
                <Text fontWeight="$bold" color="$yellow900" fontSize="$md" mb="$1">
                  ¡Próximo pago cercano!
                </Text>
                <Text color="$yellow900">
                  Recuerda que el pago de tu deuda "Renta" vence el 15/08/2025.
                  No olvides realizarlo a tiempo para evitar recargos.
                </Text>
              </VStack>
            </HStack>
          </Box>
        </VStack>
      </Box>
    </SafeAreaView>
  );
}
