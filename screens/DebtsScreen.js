import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Platform } from 'react-native';
import {
  Box, VStack, HStack, Text, Button, Icon, Pressable, ScrollView, ButtonText,
  Input, InputField, InputSlot, InputIcon,
  Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop,
  SelectContent, SelectItem,
  FormControl, FormControlLabel, FormControlLabelText, FormControlHelper, FormControlHelperText,
  Popover, PopoverBackdrop, PopoverContent, PopoverArrow, PopoverBody,
  Spinner,
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppMenuPopover from '../components/AppMenuPopover';

// API objetivos y aportes
import {
  getObjetivos,
  postObjetivo,
  putObjetivo,
  deleteObjetivo,
  patchObjetivoEstado,
  postAporte, // <-- importante
} from '../api';

/* ==== Utils ==== */
const GOAL_TYPES = [
  { label: 'Ahorro general', value: 'ahorro' },
  { label: 'Vehículo', value: 'vehiculo' },
  { label: 'Viaje', value: 'viaje' },
  { label: 'Emergencias', value: 'emergencias' },
];

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
const isValidAmount = (v) => /^\d+([.,]\d{1,2})?$/.test(String(v).replace(',', '.'));

// Loader de pantalla completa reutilizable
const FullScreenLoader = ({ text = 'Cargando…' }) => (
  <Box
    position="absolute"
    style={StyleSheet.absoluteFillObject}
    bg="rgba(255,255,255,0.7)"
    zIndex={999}
    alignItems="center"
    justifyContent="center"
    pointerEvents="auto"
  >
    <Spinner size="large" color="$red600" />
    <Text mt="$2" color="$red600">{text}</Text>
  </Box>
);

/* ===== Menú de acciones por tarjeta ===== */
function GoalActionsMenu({ onEdit, onPause, onComplete, onDelete, onDeposit }) {
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
          <Icon as={MaterialIcons} name="more-vert" size={20} color="$black" />
        </Pressable>
      )}
    >
      <PopoverBackdrop />
      <PopoverContent w={220} p="$0">
        <PopoverArrow />
        <PopoverBody p="$0">
          <VStack divider={<Box h={1} bg="$coolGray100" />}>
            <Item icon="savings" label="Abonar" onPress={onDeposit} />
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

/* ==== Card de objetivo (shape API) ==== */
function GoalCard({ item, onEdit, onPause, onComplete, onDelete, onDeposit }) {
  const pct = progressPct(Number(item.monto_ahorrado || 0), Number(item.monto_meta || 0));
  return (
    <Box bg="$white" borderRadius="$xl" p="$4" borderWidth={1} borderColor="$coolGray200">
      <HStack alignItems="center" justifyContent="space-between">
        <VStack>
          <Text fontWeight="$bold" fontSize="$md" color="$black">{item.nombre}</Text>
          <Text color="$coolGray500" fontSize="$xs">
            Fecha límite {item.fecha_vencimiento ? formatMX(new Date(item.fecha_vencimiento)) : '—'}
          </Text>
        </VStack>

        <GoalActionsMenu
          onEdit={() => onEdit(item)}
          onPause={() => onPause(item)}
          onComplete={() => onComplete(item)}
          onDelete={() => onDelete(item)}
          onDeposit={() => onDeposit(item)} // <-- NUEVO
        />
      </HStack>

      <Box bg="$coolGray200" h={10} borderRadius="$lg" mt="$3" overflow="hidden">
        <Box bg="#2D2DAA" h="100%" w={`${pct}%`} borderRadius="$lg" />
      </Box>

      <HStack justifyContent="space-between" mt="$2">
        <Text color="#2D2DAA" fontWeight="$bold">
          Ahorrado: MXN {Number(item.monto_ahorrado || 0).toLocaleString('es-MX')}
        </Text>
        <Text color="$coolGray600">
          Meta: MXN {Number(item.monto_meta || 0).toLocaleString('es-MX')}
        </Text>
      </HStack>
    </Box>
  );
}

export default function GoalsScreen({
  token,
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
  const [tab, setTab] = useState('activos'); // activos | pausado | completados

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [goals, setGoals] = useState({ activos: [], pausado: [], completados: [] });

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

  // Modal de abono (aporte)
  const [showDeposit, setShowDeposit] = useState(false);
  const [deposit, setDeposit] = useState({ objetivoId: null, amount: '', note: '' });
  const [savingDeposit, setSavingDeposit] = useState(false);

  const list = goals[tab] || [];
  const isValidForm = form.name.trim() && form.type && isValidAmount(form.amount);
  const isValidDeposit = isValidAmount(deposit.amount) && Number(String(deposit.amount).replace(',', '.')) > 0;

  /* ===== Carga desde API ===== */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [a, p, c] = await Promise.all([
        getObjetivos(token, 'activo'),
        getObjetivos(token, 'pausado'),
        getObjetivos(token, 'completado'),
      ]);
      setGoals({
        activos: Array.isArray(a) ? a : [],
        pausado: Array.isArray(p) ? p : [],
        completados: Array.isArray(c) ? c : [],
      });
    } catch (e) {
      console.error('Error cargando objetivos:', e?.message || e);
      setGoals({ activos: [], pausado: [], completados: [] });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchAll();
  }, [token]);

  /* ===== acciones del menú ===== */
  const handleEdit = (item) => {
    setForm({
      id: String(item.id),
      name: item.nombre || '',
      type: item.tipo || '',
      amount: String(item.monto_meta ?? ''),
      startDate: item.fecha_inicio ? new Date(item.fecha_inicio) : new Date(),
      endDate: item.fecha_vencimiento ? new Date(item.fecha_vencimiento) : new Date(),
    });
    setShowForm(true);
  };

  const handlePause = async (item) => {
    try {
      await patchObjetivoEstado(item.id, 'pausado', token);
      await fetchAll();
      setTab('pausado');
    } catch (e) {
      console.error('Error pausando objetivo:', e?.message || e);
      alert('No se pudo pausar el objetivo');
    }
  };

  const handleComplete = async (item) => {
    try {
      await patchObjetivoEstado(item.id, 'completado', token);
      await fetchAll();
      setTab('completados');
    } catch (e) {
      console.error('Error completando objetivo:', e?.message || e);
      alert('No se pudo completar el objetivo');
    }
  };

  const handleDelete = async (item) => {
    try {
      await deleteObjetivo(item.id, token);
      await fetchAll();
    } catch (e) {
      console.error('Error eliminando objetivo:', e?.message || e);
      alert('No se pudo eliminar el objetivo');
    }
  };

  const handleDepositOpen = (item) => {
    setDeposit({ objetivoId: item.id, amount: '', note: '' });
    setShowDeposit(true);
  };

  const handleDepositSave = async () => {
    if (!isValidDeposit) return;
    setSavingDeposit(true);
    try {
      const amountNum = Number(String(deposit.amount).replace(',', '.'));
      await postAporte(deposit.objetivoId, { monto: amountNum, nota: deposit.note || '' }, token);
      setShowDeposit(false);
      setDeposit({ objetivoId: null, amount: '', note: '' });
      await fetchAll(); // refresca barra de progreso (monto_ahorrado)
    } catch (e) {
      console.error('Error al abonar:', e?.message || e);
      alert('No se pudo registrar el abono');
    } finally {
      setSavingDeposit(false);
    }
  };

  /* ===== alta/edición ===== */
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

  const saveForm = async () => {
    if (!isValidForm) return;
    setSaving(true);
    try {
      const payload = {
        nombre: form.name.trim(),
        tipo: form.type,
        monto_meta: Number(String(form.amount).replace(',', '.')),
        fecha_inicio: form.startDate.toISOString(),
        fecha_vencimiento: form.endDate.toISOString(),
      };

      if (form.id) {
        await putObjetivo(form.id, payload, token);
      } else {
        await postObjetivo(payload, token); // estado inicial = activo
      }
      setShowForm(false);
      await fetchAll();
      if (!form.id) setTab('activos');
    } catch (e) {
      console.error('Error guardando objetivo:', e?.message || e);
      alert('No se pudo guardar el objetivo');
    } finally {
      setSaving(false);
    }
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
        <Pressable disabled={!isValidForm || saving} onPress={saveForm} opacity={isValidForm && !saving ? 1 : 0.4}>
          {saving ? <Spinner /> : <Icon as={MaterialIcons} name="check" size="xl" color="$black" />}
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

            {/* Fecha inicio */}
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

            {/* Fecha vencimiento */}
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
              isDisabled={!isValidForm || saving}
              opacity={isValidForm && !saving ? 1 : 0.6}
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
        {['activos', 'pausado', 'completados'].map((key) => {
          const label = key === 'activos' ? 'Activos' : key === 'pausado' ? 'Pausado' : 'Completados';
          const selected = tab === key;
          return (
            <Button
              key={key}
              onPress={() => setTab(key)}
              bg={selected ? '$black' : '$white'}
              variant={selected ? 'solid' : 'outline'}
              borderColor="$coolGray300"
              borderRadius="$md"
              px="$5"
              py="$2"
            >
              <ButtonText color={selected ? '$white' : '$black'} fontWeight="$bold">
                {label}
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
          {loading && (
            <HStack space="$2" alignItems="center">
              <Spinner />
              <Text color="$coolGray500">Cargando…</Text>
            </HStack>
          )}

          {!loading && list.length === 0 ? (
            <Text color="$coolGray500" fontSize="$sm">No hay objetivos en esta pestaña.</Text>
          ) : (
            list.map((g) => (
              <GoalCard
                key={g.id}
                item={g}
                onEdit={handleEdit}
                onPause={handlePause}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onDeposit={handleDepositOpen} // <-- pasa handler
              />
            ))
          )}
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

      {/* Modal: Abonar (aporte) */}
      {showDeposit && (
        <Box
          position="absolute"
          top={0} left={0} right={0} bottom={0}
          bg="rgba(0,0,0,0.35)"
          zIndex={200}
          alignItems="center"
          justifyContent="center"
        >
          <Box w="90%" maxW={420} bg="$white" p="$4" borderRadius="$2xl" borderWidth={1} borderColor="$coolGray200">
            <VStack space="$3">
              <HStack alignItems="center" justifyContent="space-between">
                <HStack alignItems="center" space="$2">
                  <Icon as={MaterialIcons} name="savings" size={22} color="$black" />
                  <Text fontWeight="$bold" fontSize="$md" color="$black">Abonar al objetivo</Text>
                </HStack>
                <Pressable onPress={() => setShowDeposit(false)}>
                  <Icon as={MaterialIcons} name="close" size={22} color="$coolGray500" />
                </Pressable>
              </HStack>

              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText fontWeight="$bold" color="$black">Monto</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="attach-money" /></InputSlot>
                  <InputField
                    placeholder="Ej. 500.00"
                    keyboardType="numeric"
                    value={deposit.amount}
                    onChangeText={(v) => setDeposit((d) => ({ ...d, amount: v }))}
                  />
                </Input>
                <FormControlHelper>
                  <FormControlHelperText>Solo números, hasta 2 decimales.</FormControlHelperText>
                </FormControlHelper>
              </FormControl>

              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText fontWeight="$bold" color="$black">Nota (opcional)</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="notes" /></InputSlot>
                  <InputField
                    placeholder="Comentario del aporte"
                    value={deposit.note}
                    onChangeText={(v) => setDeposit((d) => ({ ...d, note: v }))}
                  />
                </Input>
              </FormControl>

              <HStack mt="$2" space="$2" justifyContent="flex-end">
                <Button variant="outline" borderColor="$coolGray300" bg="$white" onPress={() => setShowDeposit(false)}>
                  <ButtonText color="$black">Cancelar</ButtonText>
                </Button>
                <Button
                  bg="$red600"
                  onPress={handleDepositSave}
                  isDisabled={!isValidDeposit || savingDeposit}
                  opacity={isValidDeposit && !savingDeposit ? 1 : 0.6}
                >
                  {savingDeposit ? <Spinner color="$white" /> : <ButtonText color="$white">Abonar</ButtonText>}
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <Box flex={1} bg="$white" position="relative">
        {showForm ? renderForm() : renderList()}

        {/* Overlay inicial */}
        {initialLoading && <FullScreenLoader text="Cargando…" />}

        {/* Overlay guardando (form principal) */}
        {saving && <FullScreenLoader text="Guardando…" />}
      </Box>
    </SafeAreaView>
  );
}
