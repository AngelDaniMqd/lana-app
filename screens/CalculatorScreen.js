import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, Pressable, Divider,
  Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel,
  Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal,
  SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator,
  SelectItem, ScrollView, ButtonText
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';

const methods = [
  { label: 'Ingreso', value: 'ingreso' },
  { label: 'Gasto', value: 'gasto' },
];

const categories = [
  { label: 'Alimentos', value: 'alimentos' },
  { label: 'Servicios', value: 'servicios' },
  { label: 'Transporte', value: 'transporte' },
];

const accounts = [
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Cuenta', value: 'cuenta' },
];

const keypad = [
  ['7', '8', '9', '/'],
  ['4', '5', '6', '*'],
  ['1', '2', '3', '-'],
  ['.', '0', '←', '+'],
];

export default function CalculatorScreen({ onBack = () => {}, onSave = () => {}, onHome = () => {}, onNotifications }) {
  const [method, setMethod] = useState('gasto');
  const [account, setAccount] = useState('efectivo');
  const [category, setCategory] = useState('alimentos');
  const [amount, setAmount] = useState('');

  const isOperator = (k) => ['/', '*', '-', '+'].includes(k);

  const handleKeyPress = (key) => {
    if (key === '←') {
      setAmount((a) => (a.length ? a.slice(0, -1) : ''));
      return;
    }
    if (isOperator(key)) return;
    if (key === '.' && amount.includes('.')) return;
    setAmount((a) => (a === '0' && key !== '.' ? key : a + key));
  };

  // long-press en backspace para limpiar todo
  const handleBackspaceLong = () => setAmount('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <Box flex={1} bg="$white">
        {/* Header */}
        <HStack alignItems="center" justifyContent="space-between" px="$4" py="$3" bg="$white">
          <Pressable onPress={onBack}>
            <HStack alignItems="center" space="$1.5">
              <Icon as={MaterialIcons} name="arrow-back-ios" size={20} color="$black" />
              <Text color="$black">Regresar</Text>
            </HStack>
          </Pressable>
          <Pressable onPress={onSave}>
            <Icon as={MaterialIcons} name="check" size={24} color="$black" />
          </Pressable>
        </HStack>
        <Divider />

        {/* Contenido scrollable (método, monto, selects) */}
        <ScrollView
          flex={1}
          bg="$white"
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Método */}
          <VStack px="$6" py="$4" space="$3">
            <Text fontWeight="$bold" fontSize="$md" color="$black">
              Selecciona Método:
            </Text>

            <RadioGroup value={method} onChange={setMethod} direction="row" space="$10">
              {methods.map((m) => (
                <Radio key={m.value} value={m.value}>
                  <RadioIndicator mr="$2" borderColor="$coolGray500">
                    <RadioIcon as={MaterialIcons} name="circle" />
                  </RadioIndicator>
                  <RadioLabel>{m.label}</RadioLabel>
                </Radio>
              ))}
            </RadioGroup>
          </VStack>
          <Divider />

          {/* Monto grande (tarjeta sutil) */}
          <VStack px="$6" py="$4" space="$2">
            <Box
              bg="$white"
              borderRadius="$xl"
              borderWidth={1}
              borderColor="$coolGray200"
              px="$4"
              py="$3"
              alignItems="center"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                elevation: 1,
              }}
            >
              <Text
                fontSize="$5xl"
                fontWeight="$bold"
                textAlign="center"
                color={method === 'gasto' ? '$black' : '$green700'}
              >
                {method === 'gasto' ? '-' : ''}MXN {amount || '0'}
              </Text>
            </Box>
          </VStack>
          <Divider />

          {/* Selects en fila: Cuenta / Categoría */}
          <HStack px="$6" pt="$3" pb="$2" space="$3">
            <Select selectedValue={account} onValueChange={setAccount} flex={1}>
              <SelectTrigger variant="outline" size="md" borderColor="$coolGray300">
                <SelectInput placeholder="Cuenta" />
                <SelectIcon as={MaterialIcons} name="expand-more" size={20} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {accounts.map((a) => (
                    <SelectItem key={a.value} label={a.label} value={a.value} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>

            <Select selectedValue={category} onValueChange={setCategory} flex={1}>
              <SelectTrigger variant="outline" size="md" borderColor="$coolGray300">
                <SelectInput placeholder="Categoría" />
                <SelectIcon as={MaterialIcons} name="expand-more" size={20} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {categories.map((c) => (
                    <SelectItem key={c.value} label={c.label} value={c.value} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </HStack>
        </ScrollView>

        {/* Teclado numérico fijo abajo (no scrollea) */}
        <Box
          px="$6"
          pt="$3"
          pb="$5"
          bg="$white"
          borderTopWidth={1}
          borderTopColor="$coolGray200"
        >
          <VStack space="$3">
            {keypad.map((row, i) => (
              <HStack key={i} space="$3" justifyContent="space-between">
                {row.map((key) => {
                  const operator = isOperator(key) || key === '←';
                  const isBack = key === '←';
                  return (
                    <Button
                      key={key}
                      onPress={() => handleKeyPress(key)}
                      onLongPress={isBack ? handleBackspaceLong : undefined}
                      variant={operator ? 'outline' : 'solid'}
                      bg={operator ? '$white' : '$coolGray100'}
                      borderColor="$coolGray300"
                      borderWidth={1}
                      borderRadius="$lg"
                      w="$20"
                      h="$20"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <ButtonText fontSize="$2xl" color="$black">
                        {key}
                      </ButtonText>
                    </Button>
                  );
                })}
              </HStack>
            ))}
          </VStack>
        </Box>
      </Box>
    </SafeAreaView>
  );
}
