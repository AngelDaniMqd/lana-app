import React from 'react';
import {
  Popover, PopoverBackdrop, PopoverContent, PopoverArrow, PopoverBody,
  VStack, Box, Pressable, HStack, Text, Icon
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';

export default function AppMenuPopover({
  showPopover, setShowPopover,
  onHome, onMenu, onStatistics, onDebts, onGoals, onBudgets, onRecurring, onLogout
}) {
  return (
    <Popover
      isOpen={showPopover}
      onClose={() => setShowPopover(false)}
      trigger={triggerProps => (
        <Pressable
          {...triggerProps}
          onPress={() => setShowPopover(true)}
          rounded="$full"
          p="$2"
          bg="$coolGray100"
        >
          <Icon as={MaterialIcons} name="menu" size={24} color="$black" />
        </Pressable>
      )}
    >
      <PopoverBackdrop />
      <PopoverContent w={220}>
        <PopoverArrow />
        <PopoverBody p={0}>
          <VStack divider={<Box h={1} bg="$coolGray100" />} space={0}>
            <Pressable px="$4" py="$3" onPress={() => { setShowPopover(false); onHome?.(); }}>
              <Text>Inicio</Text>
            </Pressable>
            <Pressable px="$4" py="$3" onPress={() => { setShowPopover(false); onMenu?.(); }}>
              <Text>Registros</Text>
            </Pressable>
            <Pressable px="$4" py="$3" onPress={() => { setShowPopover(false); onStatistics?.(); }}>
              <Text>Estadísticas</Text>
            </Pressable>
            <Pressable px="$4" py="$3" onPress={() => { setShowPopover(false); onDebts?.(); }}>
              <Text>Deudas</Text>
            </Pressable>
            <Pressable px="$4" py="$3" onPress={() => { setShowPopover(false); onGoals?.(); }}>
              <Text>Objetivos</Text>
            </Pressable>
            <Pressable px="$4" py="$3" onPress={() => { setShowPopover(false); onBudgets?.(); }}>
              <Text>Presupuestos</Text>
            </Pressable>
            <Pressable px="$4" py="$3" onPress={() => { setShowPopover(false); onRecurring?.(); }}>
              <Text>Pagos Fijos</Text>
            </Pressable>
            <Pressable px="$4" py="$3" onPress={() => { setShowPopover(false); onLogout?.(); }}>
              <Text color="$red600">Cerrar Sesión</Text>
            </Pressable>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}