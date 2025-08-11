import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, Pressable, ScrollView, ButtonText,
  Input, InputField, InputSlot, InputIcon,
  Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop,
  SelectContent, SelectItem,
  FormControl, FormControlLabel, FormControlLabelText, FormControlHelper, FormControlHelperText,
  Popover, PopoverBackdrop, PopoverContent, PopoverArrow, PopoverBody,
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import AppMenuPopover from '../components/AppMenuPopover';

/* ==== Datos mock (semilla) ==== */
const GOAL_TYPES = [
  { label: 'Ahorro general', value: 'ahorro' },
  { label: 'Vehículo', value: 'vehiculo' },
  { label: 'Viaje', value: 'viaje' },
  { label: 'Emergencias', value: 'emergencias' },
];

const seedGoals = {
  activos: [
    { id: '1', title: 'Vehículo nuevo', date: '27/05/2028', saved: 14000, goal: 100000, type: 'vehiculo' },
    { id: '2', title: 'Viaje Japón', date: '01/12/2026', saved: 35000, goal: 120000, type: 'viaje' },
  ],
  pausado: [
    { id: '3', title: 'Laptop nueva', date: '15/04/2026', saved: 8000, goal: 30000, type: 'ahorro' },
  ],
  completados: [
    { id: '4', title: 'Fondo emergencias', date: '27/05/2025', saved: 20000, goal: 20000, type: 'emergencias' },
  ],
};

/* ==== Utils ==== */
function parseDDMMYYYY(s) {
  const [dd, mm, yyyy] = s.split('/').map(Number);
  return new Date(yyyy, (mm || 1) - 1, dd || 1);
}
function formatMX(d) {
  try {
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}
function progressPct(saved, goal) {
  if (!goal || goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((saved / goal) * 100)));
}

/* ==== Tabs === */
const TABS = [
  { key: 'activos', label: 'Activos' },
  { key: 'pausado', label: 'Pausado' },
  { key: 'completados', label: 'Completados' },
];

/* ===== Menú de acciones por tarjeta ===== */
function GoalActionsMenu({ onEdit, onPause, onComplete, onDelete }) {
  const [open, setOpen] = useState(false);

  const Item = ({ icon, label, onPress, danger = false }) => (
    <Pressable
      px="$4"
      py="$3"
      onPress={() => { setOpen(false); onPress(); }}
    >
      <HStack space="$3" alignItems="center">
        <Icon as={MaterialIcons} name={icon} size={18} color={danger ? '$red600' : '$black'} />
        <Text color={danger ? '$red600' : '$black'}>{label}</Text>
      </HStack>
    </Pressable>
  );

  return (
    <Popover
      isOpen={open}
      onClose={() => setOpen(false)}
      trigger={(triggerProps) => (
        <Pressable
          {...triggerProps}
          onPress={() => setOpen(true)}
          rounded="$md"
          bg="$transparent"
          borderWidth={1}
          borderColor="$transparent"
          px="$3"
          py="$2"
        >
          <HStack space="$1" alignItems="center">
            <Icon as={MaterialIcons} name="more-vert" size={20} color="$black" />
            <Text color="$black"></Text>
          </HStack>
        </Pressable>
      )}
    >
      <PopoverBackdrop />
      <PopoverContent w={220} p="$0">
        <PopoverArrow />
        <PopoverBody p="$0">
          <VStack divider={<Box h={1} bg="$coolGray100" />}>
            <Item icon="edit" label="Editar objetivo" onPress={onEdit} />
            <Item icon="check-circle" label="Objetivo Logrado" onPress={onComplete} />
            <Item icon="pause-circle" label="Objetivo Pausado" onPress={onPause} />
            <Item icon="delete-outline" label="Eliminar Objetivo" onPress={onDelete} danger />
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

/* ==== Card de objetivo ==== */
function GoalCard({ item, onEdit, onPause, onComplete, onDelete }) {
  const pct = progressPct(item.saved, item.goal);
  return (
    <Box bg="$white" borderRadius="$xl" p="$4" borderWidth={1} borderColor="$coolGray200">
      <HStack alignItems="center" justifyContent="space-between">
        <VStack>
          <Text fontWeight="$bold" fontSize="$md" color="$black">{item.title}</Text>
          <Text color="$coolGray500" fontSize="$xs">Fecha límite {item.date}</Text>
        </VStack>

        <GoalActionsMenu
          onEdit={() => onEdit(item)}
          onPause={() => onPause(item)}
          onComplete={() => onComplete(item)}
          onDelete={() => onDelete(item)}
        />
      </HStack>

      <Box bg="$coolGray200" h={10} borderRadius="$lg" mt="$3" overflow="hidden">
        <Box bg="#2D2DAA" h="100%" w={`${pct}%`} borderRadius="$lg" />
      </Box>

      <HStack justifyContent="space-between" mt="$2">
        <Text color="#2D2DAA" fontWeight="$bold">Ahorrado: MXN {item.saved.toLocaleString('es-MX')}</Text>
        <Text color="$coolGray600">Meta: MXN {item.goal.toLocaleString('es-MX')}</Text>
      </HStack>
    </Box>
  );
}

export default function GoalsScreen({
  onAdd = () => {},
  onMenu = () => {},
  onDebts = () => {},
  onGoals = () => {},
  onStatistics = () => {},
  onHome = () => {},
  onNotifications = () => {},
  onLogout = () => {},
  onBudgets = () => {},
  onRecurring = () => {},
  onProfile = () => {},
}) {
  const [showPopover, setShowPopover] = useState(false);
  const [tab, setTab] = useState('activos');

  // Estado de objetivos (para mover entre listas)
  const [goals, setGoals] = useState(seedGoals);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [dateTarget, setDateTarget] = useState(null); // 'start' | 'end'
  const [showPicker, setShowPicker] = useState(false);
  const [form, setForm] = useState({
    id: '',
    name: '',
    type: '',
    amount: '',
    startDate: new Date(),
    endDate: new Date(),
  });

  const list = goals[tab];
  const isValidAmount = (v) => /^\d+([.,]\d{1,2})?$/.test(String(v).replace(',', '.'));
  const isValid = form.name.trim() && form.type && isValidAmount(form.amount);

  /* ===== helpers para mover/eliminar ===== */
  const moveGoal = (goal, from, to) => {
    setGoals((prev) => ({
      ...prev,
      [from]: prev[from].filter((g) => g.id !== goal.id),
      [to]: [...prev[to], goal],
    }));
    if (tab !== to) setTab(to);
  };

  const deleteGoal = (goal, from) => {
    setGoals((prev) => ({
      ...prev,
      [from]: prev[from].filter((g) => g.id !== goal.id),
    }));
  };

  /* ===== acciones del menú ===== */
  const handleEdit = (item) => {
    setForm({
      id: item.id,
      name: item.title,
      type: item.type || '',
      amount: String(item.goal ?? ''),
      startDate: new Date(),
      endDate: parseDDMMYYYY(item.date),
    });
    setShowForm(true);
  };
  const handlePause = (item) => moveGoal(item, tab, 'pausado');
  const handleComplete = (item) => moveGoal(item, tab, 'completados');
  const handleDelete = (item) => deleteGoal(item, tab);

  /* ===== alta/edición (botón + y guardar) ===== */
  const handleAddNew = () => {
    setForm({
      id: '',
      name: '',
      type: '',
      amount: '',
      startDate: new Date(),
      endDate: new Date(),
    });
    setShowForm(true);
  };

  const saveForm = () => {
    if (!isValid) return;
    if (form.id) {
      // editar: buscar en todas las listas y actualizar
      setGoals((prev) => {
        const update = (arr) =>
          arr.map((g) =>
            g.id === form.id
              ? {
                  ...g,
                  title: form.name,
                  type: form.type,
                  goal: Number(String(form.amount).replace(',', '.')),
                  date: formatMX(form.endDate),
                }
              : g
          );
        return {
          activos: update(prev.activos),
          pausado: update(prev.pausado),
          completados: update(prev.completados),
        };
      });
    } else {
      // crear nuevo en la pestaña actual
      const newGoal = {
        id: Date.now().toString(),
        title: form.name,
        type: form.type,
        goal: Number(String(form.amount).replace(',', '.')),
        saved: 0,
        date: formatMX(form.endDate),
      };
      setGoals((prev) => ({ ...prev, [tab]: [...prev[tab], newGoal] }));
    }
    setShowForm(false);
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

  /* ===== FORM ===== */
  const renderForm = () => (
    <Box flex={1} bg="$white">
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
        <Pressable disabled={!isValid} onPress={saveForm} opacity={isValid ? 1 : 0.4}>
          <Icon as={MaterialIcons} name="check" size="xl" color="$black" />
        </Pressable>
      </HStack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <VStack space="$2" mb="$2">
          <Text fontWeight="$bold" fontSize={20} color="$black">
            {form.id ? 'Editar objetivo' : 'Nuevo objetivo'}
          </Text>
          <Text color="$coolGray600" fontSize={12}>
            Completa los campos para guardar tu objetivo.
          </Text>
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
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Nombre del objetivo</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="flag" /></InputSlot>
                <InputField
                  placeholder="Ej. Vehículo nuevo"
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />
              </Input>
              <FormControlHelper>
                <FormControlHelperText>Un nombre claro te ayudará a identificarlo.</FormControlHelperText>
              </FormControlHelper>
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Tipo de objetivo</FormControlLabelText>
              </FormControlLabel>
              <Select
                selectedValue={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger borderColor="$coolGray300" bg="$white">
                  <SelectInput placeholder="Selecciona alguna opción" />
                  <SelectIcon as={MaterialIcons} name="expand-more" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    {GOAL_TYPES.map((g) => (
                      <SelectItem key={g.value} label={g.label} value={g.value} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Cantidad meta</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="attach-money" /></InputSlot>
                <InputField
                  placeholder="MXN 0.00"
                  keyboardType="numeric"
                  value={form.amount}
                  onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
                />
              </Input>
              <FormControlHelper>
                <FormControlHelperText>Solo números, hasta 2 decimales.</FormControlHelperText>
              </FormControlHelper>
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Fecha inicio</FormControlLabelText>
              </FormControlLabel>
              <Pressable
                onPress={() => openDate('start')}
                borderWidth={1}
                borderColor="$coolGray300"
                borderRadius="$lg"
                px="$3"
                py="$3"
                bg="$white"
              >
                <HStack alignItems="center" justifyContent="space-between">
                  <HStack alignItems="center" space="$2">
                    <Icon as={MaterialIcons} name="calendar-today" size="lg" color="$coolGray600" />
                    <Text color="$black">{formatMX(form.startDate)}</Text>
                  </HStack>
                  <Icon as={MaterialIcons} name="expand-more" size="lg" color="$coolGray600" />
                </HStack>
              </Pressable>
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Fecha de vencimiento</FormControlLabelText>
              </FormControlLabel>
              <Pressable
                onPress={() => openDate('end')}
                borderWidth={1}
                borderColor="$coolGray300"
                borderRadius="$lg"
                px="$3"
                py="$3"
                bg="$white"
              >
                <HStack alignItems="center" justifyContent="space-between">
                  <HStack alignItems="center" space="$2">
                    <Icon as={MaterialIcons} name="event" size="lg" color="$coolGray600" />
                    <Text color="$black">{formatMX(form.endDate)}</Text>
                  </HStack>
                  <Icon as={MaterialIcons} name="expand-more" size="lg" color="$coolGray600" />
                </HStack>
              </Pressable>
            </FormControl>

            <Button
              bg="$red600"
              borderRadius="$xl"
              h="$16"
              mt="$2"
              onPress={saveForm}
              isDisabled={!isValid}
              opacity={isValid ? 1 : 0.6}
            >
              <ButtonText fontSize="$lg" fontWeight="$semibold" color="$white">
                {form.id ? 'Guardar cambios' : 'Guardar objetivo'}
              </ButtonText>
            </Button>
          </VStack>
        </Box>
      </ScrollView>

      {showPicker && (
        <DateTimePicker
          value={dateTarget === 'start' ? form.startDate : form.endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onChangeDate}
        />
      )}
    </Box>
  );

  /* ===== LISTA ===== */
  const renderList = () => (
    <>
      {/* Header con menú */}
      <HStack px="$6" py="$4" alignItems="center" justifyContent="space-between">
        <AppMenuPopover
          showPopover={showPopover}
          setShowPopover={setShowPopover}
          onMenu={onMenu}
          onStatistics={onStatistics}
          onDebts={onDebts}
          onGoals={onGoals}
          onHome={onHome}
          onLogout={onLogout}
          onBudgets={onBudgets}
          onRecurring={onRecurring}
            onProfile={onProfile}
        />
        <Text fontSize={24} fontWeight="$bold" color="$black">Objetivos</Text>
        <Pressable rounded="$full" p="$2" bg="$coolGray100" onPress={onNotifications}>
          <Icon as={MaterialIcons} name="notifications-none" size={24} color="$black" />
        </Pressable>
      </HStack>

      {/* Tabs centradas */}
      <HStack px="$6" py="$2" alignItems="center" justifyContent="center" space="$3">
        {TABS.map((t) => {
          const selected = tab === t.key;
          return (
            <Button
              key={t.key}
              onPress={() => setTab(t.key)}
              bg={selected ? '$black' : '$white'}
              variant={selected ? 'solid' : 'outline'}
              borderColor="$coolGray300"
              borderRadius="$md"
              px="$5"
              py="$2"
            >
              <ButtonText color={selected ? '$white' : '$black'} fontWeight="$bold">
                {t.label}
              </ButtonText>
            </Button>
          );
        })}
      </HStack>

      {/* Lista */}
      <ScrollView
        px={0}
        py={8}
        contentContainerStyle={{ paddingBottom: 80, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack px="$6" space="$4">
          {list.map((g) => (
            <GoalCard
              key={g.id}
              item={g}
              onEdit={handleEdit}
              onPause={handlePause}
              onComplete={handleComplete}
              onDelete={handleDelete}
            />
          ))}
        </VStack>
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
          onPress={handleAddNew}
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
        {showForm ? renderForm() : renderList()}
      </Box>
    </SafeAreaView>
  );
}
