import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, Pressable, ScrollView, Avatar, ButtonText,
  Input, InputField, InputIcon, InputSlot,
  Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop,
  SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem,
  FormControl, FormControlError, FormControlErrorText, FormControlLabel, FormControlLabelText,
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppMenuPopover from '../components/AppMenuPopover';

/* ===== Mock data ===== */
const debtsData = {
  presto: [
    { name: 'Juan', desc: 'Renta', amount: 128.5, img: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { name: 'Jose', desc: 'Trabajo', amount: 200.5, img: 'https://randomuser.me/api/portraits/men/2.jpg' },
  ],
  mePrestaron: [
    { name: 'Juan', desc: 'Electricidad', amount: -128.5, img: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { name: 'Jose', desc: 'Electricidad', amount: -100.5, img: 'https://randomuser.me/api/portraits/men/2.jpg' },
  ],
};

const cuentas = [
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Cuenta', value: 'cuenta' },
];

const fmtDate = (d) =>
  d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fmtMoney = (n) =>
  (n < 0 ? `-MXN ${Math.abs(n).toFixed(2)}` : `MXN ${n.toFixed(2)}`);

/* ===== Pantalla ===== */
export default function DebtsScreen({
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
  const [showPopover, setShowPopover] = useState(false);
  const [tab, setTab] = useState('mePrestaron'); // 'mePrestaron' | 'presto'
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    desc: '',
    account: '',
    amount: '',
    startDate: new Date(),
    endDate: new Date(),
  });

  const [dateTarget, setDateTarget] = useState(null); // 'start' | 'end'
  const [showPicker, setShowPicker] = useState(false);

  const validAmount = (v) => /^(\d+)([.,]\d{1,2})?$/.test(String(v).replace(',', '.'));
  const isValid = form.name.trim() && form.account && validAmount(form.amount);

  const openForm = () => {
    setForm({
      name: '',
      desc: '',
      account: '',
      amount: '',
      startDate: new Date(),
      endDate: new Date(),
    });
    setShowForm(true);
  };

  const openDate = (which) => {
    setDateTarget(which);
    setShowPicker(true);
  };

  const onChangeDate = (_e, selected) => {
    if (!selected) {
      setShowPicker(false);
      return;
    }
    setForm((f) => ({
      ...f,
      [dateTarget === 'start' ? 'startDate' : 'endDate']: selected,
    }));
    if (Platform.OS !== 'ios') setShowPicker(false);
  };

  const handleSave = () => {
    if (!isValid) return;
    // Aquí iría tu persistencia (API/local)
    setShowForm(false);
  };

  /* ===== Reusables ===== */
  const DateRow = ({ label, value, onPress }) => (
    <VStack space="$2">
      <FormControlLabel>
        <FormControlLabelText fontWeight="$bold" color="$black">
          {label}
        </FormControlLabelText>
      </FormControlLabel>
      <Pressable onPress={onPress}>
        <HStack
          alignItems="center"
          justifyContent="space-between"
          borderWidth={1}
          borderColor="$coolGray300"
          borderRadius="$lg"
          px="$3"
          py="$3"
          bg="$white"
        >
          <HStack alignItems="center" space="$2">
            <Icon as={MaterialIcons} name="calendar-today" size="lg" color="$coolGray500" />
            <Text color="$black">{fmtDate(value)}</Text>
          </HStack>
          <Icon as={MaterialIcons} name="expand-more" size="xl" color="$coolGray500" />
        </HStack>
      </Pressable>
    </VStack>
  );

  /* ===== Lista ===== */
  const renderList = () => (
    <>
      {/* Header */}
      <HStack px="$6" py="$4" alignItems="center" justifyContent="space-between">
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
        <Text fontSize="$2xl" fontWeight="$bold" color="$black">
          Deudas
        </Text>
        <Pressable rounded="$full" p="$2" bg="$coolGray100" onPress={onNotifications}>
          <Icon as={MaterialIcons} name="notifications-none" size={24} color="$black" />
        </Pressable>
      </HStack>

      {/* Tabs */}
      <HStack px="$6" space="$4" mb="$2">
        <Button
          bg={tab === 'mePrestaron' ? '$black' : '$white'}
          borderRadius="$md"
          px="$4"
          py="$2"
          onPress={() => setTab('mePrestaron')}
          variant={tab === 'mePrestaron' ? 'solid' : 'outline'}
          borderColor="$coolGray300"
        >
          <ButtonText color={tab === 'mePrestaron' ? '$white' : '$black'} fontWeight="$bold">
            Me prestaron
          </ButtonText>
        </Button>
        <Button
          bg={tab === 'presto' ? '$black' : '$white'}
          borderRadius="$md"
          px="$4"
          py="$2"
          onPress={() => setTab('presto')}
          variant={tab === 'presto' ? 'solid' : 'outline'}
          borderColor="$coolGray300"
        >
          <ButtonText color={tab === 'presto' ? '$white' : '$black'} fontWeight="$bold">
            Prestó
          </ButtonText>
        </Button>
      </HStack>

      {/* Lista */}
      <ScrollView
        flex={1}
        px="$4"
        py="$2"
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Box bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$coolGray200" p="$4">
          {tab === 'mePrestaron' ? (
            <>
              <Text fontWeight="$bold" fontSize="$md" color="$black" mb="$1">
                Me prestaron
              </Text>
              <Text color="$coolGray500" fontSize="$sm" mb="$2">
                Registra todos los donativos que recibiste.
              </Text>
              <VStack space="$2">
                {debtsData.mePrestaron.map((item, idx) => (
                  <HStack
                    key={idx}
                    alignItems="center"
                    justifyContent="space-between"
                    bg="$white"
                    borderRadius="$lg"
                    p="$3"
                    borderWidth={1}
                    borderColor="$coolGray100"
                  >
                    <HStack alignItems="center" space="$3">
                      <Avatar size="md" source={{ uri: item.img }} />
                      <VStack>
                        <Text fontWeight="$bold" color="$black">
                          {item.name}
                        </Text>
                        <Text color="$coolGray500">{item.desc}</Text>
                      </VStack>
                    </HStack>
                    <Text color="$red600" fontWeight="$bold">
                      {fmtMoney(item.amount)}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </>
          ) : (
            <>
              <Text fontWeight="$bold" fontSize="$md" color="$black" mb="$1">
                Prestó
              </Text>
              <Text color="$coolGray500" fontSize="$sm" mb="$2">
                Registra todos los donativos que realices.
              </Text>
              <VStack space="$2">
                {debtsData.presto.map((item, idx) => (
                  <HStack
                    key={idx}
                    alignItems="center"
                    justifyContent="space-between"
                    bg="$white"
                    borderRadius="$lg"
                    p="$3"
                    borderWidth={1}
                    borderColor="$coolGray100"
                  >
                    <HStack alignItems="center" space="$3">
                      <Avatar size="md" source={{ uri: item.img }} />
                      <VStack>
                        <Text fontWeight="$bold" color="$black">
                          {item.name}
                        </Text>
                        <Text color="$coolGray500">{item.desc}</Text>
                      </VStack>
                    </HStack>
                    <Text color="$green600" fontWeight="$bold">
                      {fmtMoney(item.amount)}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </>
          )}
        </Box>
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
          onPress={openForm}
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

  /* ===== Formulario ===== */
  const renderForm = () => (
    <>
      {/* Header form */}
      <HStack
        alignItems="center"
        justifyContent="space-between"
        px="$4"
        py="$3"
        borderBottomWidth={1}
        borderBottomColor="$coolGray100"
      >
        <Pressable onPress={() => setShowForm(false)}>
          <HStack alignItems="center" space="$1.5">
            <Icon as={MaterialIcons} name="arrow-back-ios" size="md" color="$black" />
            <Text color="$black">Regresar</Text>
          </HStack>
        </Pressable>
        <Pressable disabled={!isValid} onPress={handleSave} opacity={isValid ? 1 : 0.4}>
          <Icon as={MaterialIcons} name="check" size="xl" color="$black" />
        </Pressable>
      </HStack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Box bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$coolGray200" p="$4">
          <Text fontWeight="$bold" fontSize="$xl" color="$black" mb="$1">
            {tab === 'mePrestaron' ? 'Me prestaron' : 'Prestó'}
          </Text>
          <Text color="$coolGray500" fontSize="$sm" mb="$4">
            {tab === 'mePrestaron'
              ? 'Registra todos los donativos que recibiste.'
              : 'Registra todos los donativos que realices.'}
          </Text>

          <VStack space="$4">
            {/* Nombre */}
            <FormControl isRequired isInvalid={!form.name.trim()}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">
                  Nombre
                </FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3">
                  <InputIcon as={MaterialIcons} name="person-outline" />
                </InputSlot>
                <InputField
                  placeholder="¿A quién?"
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />
              </Input>
              {!form.name.trim() && (
                <FormControlError>
                  <FormControlErrorText>El nombre es obligatorio.</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Descripción */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">
                  Descripción
                </FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3">
                  <InputIcon as={MaterialIcons} name="notes" />
                </InputSlot>
                <InputField
                  placeholder="¿Para qué era?"
                  value={form.desc}
                  onChangeText={(v) => setForm((f) => ({ ...f, desc: v }))}
                />
              </Input>
            </FormControl>

            {/* Cuenta (Select) */}
            <FormControl isRequired isInvalid={!form.account}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">
                  Cuenta
                </FormControlLabelText>
              </FormControlLabel>

              {/* No mezclar Input* dentro del SelectTrigger */}
              <Select
                selectedValue={form.account}
                onValueChange={(v) => setForm((f) => ({ ...f, account: v }))}
              >
                <SelectTrigger borderColor="$coolGray300" bg="$white">
                  <SelectInput placeholder="Selecciona la cuenta" />
                  <SelectIcon as={MaterialIcons} name="expand-more" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {cuentas.map((c) => (
                      <SelectItem key={c.value} label={c.label} value={c.value} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>

              {!form.account && (
                <FormControlError>
                  <FormControlErrorText>Selecciona una cuenta.</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Cantidad */}
            <FormControl isRequired isInvalid={!!form.amount && !validAmount(form.amount)}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">
                  Cantidad
                </FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3">
                  <InputIcon as={MaterialIcons} name="attach-money" />
                </InputSlot>
                <InputField
                  placeholder="Ej. 1500.50"
                  value={form.amount}
                  onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
                  keyboardType="numeric"
                />
              </Input>
              {!!form.amount && !validAmount(form.amount) && (
                <FormControlError>
                  <FormControlErrorText>Formato inválido. Ej: 1500 o 1500.50</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Fechas */}
            <DateRow label="Fecha inicio" value={form.startDate} onPress={() => openDate('start')} />
            <DateRow label="Fecha de vencimiento" value={form.endDate} onPress={() => openDate('end')} />

            {/* Botón guardar */}
            <Button
              bg="$red600"
              borderRadius="$xl"
              h="$12"           // altura mayor para mejor tacto
              mt="$4"           // más aire arriba
              onPress={handleSave}
              isDisabled={!isValid}
              opacity={isValid ? 1 : 0.6}
            >
              <ButtonText fontSize="$lg" fontWeight="$semibold" color="$white">
                Guardar
              </ButtonText>
            </Button>
          </VStack>
        </Box>
      </ScrollView>

      {/* DatePicker */}
      {showPicker && (
        <DateTimePicker
          value={dateTarget === 'start' ? form.startDate : form.endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onChangeDate}
        />
      )}
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <Box flex={1} bg="$white">
        {/* Render condicional: lista o formulario (no ambos) */}
        {showForm ? renderForm() : renderList()}
      </Box>
    </SafeAreaView>
  );
}
