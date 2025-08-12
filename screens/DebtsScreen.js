import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Platform } from 'react-native';
import {
  Box, VStack, HStack, Text, Button, Icon, Pressable, ScrollView, ButtonText,
  Input, InputField, InputIcon, InputSlot,
  Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop,
  SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem,
  FormControl, FormControlError, FormControlErrorText, FormControlLabel, FormControlLabelText,
  Popover, PopoverBackdrop, PopoverContent, PopoverArrow, PopoverBody,
  Spinner, Divider,
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppMenuPopover from '../components/AppMenuPopover';

// API
import { getDeudas, postDeuda, putDeuda, deleteDeuda, getMetodos } from '../api';

const fmtDate = (d) =>
  d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fmtMoney = (n) => `MXN ${Number(n).toFixed(2)}`;

const validAmount = (v) =>
  /^(\d+)([.,]\d{1,2})?$/.test(String(v).replace(',', '.'));

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

// método por pestaña (ids fijos de la API: 1 = Prestó, 2 = Me prestaron)
const defaultMetodoIdByTab = (tab) => String(tab === 'presto' ? 1 : 2);

export default function DebtsScreen({
  token,
  onMenu = () => {},
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
  const [showPopover, setShowPopover] = useState(false);

  const [tab, setTab] = useState('mePrestaron'); // 'mePrestaron' | 'presto'
  const [showForm, setShowForm] = useState(false);

  const [metodos, setMetodos] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    metodoId: '',
    amount: '',
    startDate: new Date(),
    endDate: new Date(),
  });

  const [dateTarget, setDateTarget] = useState(null); // 'start' | 'end'
  const [showPicker, setShowPicker] = useState(false);

  const [expandedId, setExpandedId] = useState(null);

  const isValid = form.nombre.trim() && form.metodoId && validAmount(form.amount);

  const metodoNombreById = (id) => {
    const found = metodos.find((m) => String(m.id) === String(id));
    if (found) return found.nombre;
    if (String(id) === '1') return 'Prestó';
    if (String(id) === '2') return 'Me prestaron';
    return `Método ${id}`;
  };

  // Cargar catálogos + deudas
const loadAll = async () => {
  setLoading(true);
  try {
    const [mRes, dRes] = await Promise.allSettled([getMetodos(token), getDeudas(token)]);

    setMetodos(mRes.status === 'fulfilled' ? (Array.isArray(mRes.value) ? mRes.value : []) : []);
    if (mRes.status === 'rejected') {
      console.warn('Métodos no disponibles:', mRes.reason?.message || mRes.reason);
    }

    setDeudas(dRes.status === 'fulfilled' ? (Array.isArray(dRes.value) ? dRes.value : []) : []);
    if (dRes.status === 'rejected') {
      console.warn('Deudas no disponibles:', dRes.reason?.message || dRes.reason);
    }
  } finally {
    setLoading(false);
    setInitialLoading(false);
  }
};


  useEffect(() => {
    if (!token) return;
    loadAll();
  }, [token]);

  // Asegura metodoId por pestaña aunque el catálogo no haya cargado
  useEffect(() => {
    if (!form.metodoId) {
      setForm((f) => ({ ...f, metodoId: defaultMetodoIdByTab(tab) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metodos, tab]);

  const openForm = () => {
    setEditingId(null);
    setForm({
      nombre: '',
      descripcion: '',
      metodoId: defaultMetodoIdByTab(tab), // 1 ó 2 fijo por pestaña
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

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      metodoId: String(item.categori_metodos_id ?? ''),
      amount: String(Math.abs(Number(item.monto ?? 0))).replace('.', ','),
      startDate: item.fecha_inicio ? new Date(item.fecha_inicio) : new Date(),
      endDate: item.fecha_vencimiento ? new Date(item.fecha_vencimiento) : new Date(),
    });
    // Ajusta la pestaña por método (1=presto, 2=mePrestaron)
    setTab(Number(item.categori_metodos_id) === 2 ? 'mePrestaron' : 'presto');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      // SIEMPRE guardamos monto positivo
      let amountNum = parseFloat(String(form.amount).replace(',', '.'));
      if (isNaN(amountNum)) amountNum = 0;
      amountNum = Math.abs(amountNum);

      const payload = {
        nombre: form.nombre.trim(),
        monto: amountNum.toString(),
        fecha_inicio: form.startDate.toISOString(),
        fecha_vencimiento: form.endDate.toISOString(),
        descripcion: form.descripcion ?? '',
        categori_metodos_id: String(form.metodoId), // 1=Prestó, 2=Me prestaron
      };

      if (editingId) {
        await putDeuda(editingId, payload, token);
      } else {
        await postDeuda(payload, token);
      }
      setShowForm(false);
      await loadAll();
    } catch (e) {
      console.error('Error guardando deuda:', e?.message || e);
      alert('No se pudo guardar la deuda');
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  const handleDelete = async (item) => {
    try {
      await deleteDeuda(item.id, token);
      setConfirmDelete(null);
      await loadAll();
    } catch (e) {
      console.error('Error eliminando deuda:', e?.message || e);
      alert('No se pudo eliminar la deuda');
    }
  };

  // Filtros por pestaña usando categori_metodos_id
  const listPresto = useMemo(
    () => deudas.filter((d) => Number(d.categori_metodos_id) === 1),
    [deudas]
  );
  const listMePrestaron = useMemo(
    () => deudas.filter((d) => Number(d.categori_metodos_id) === 2),
    [deudas]
  );

  const list = tab === 'mePrestaron' ? listMePrestaron : listPresto;

  // Reusable
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

  // ===== Lista =====
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
          onBudgets={onBudgets}
          onRecurring={onRecurring}
          onLogout={onLogout}
          onProfile={onProfile}
        />
        <Text fontSize="$2xl" fontWeight="$bold" color="$black">Deudas</Text>
        <Pressable rounded="$full" p="$2" onPress={onNotifications}>
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
          <HStack alignItems="center" justifyContent="space-between" mb="$3">
            <VStack>
              <Text fontWeight="$bold" fontSize="$md" color="$black">
                {tab === 'mePrestaron' ? 'Me prestaron' : 'Prestó'}
              </Text>
              <Text color="$coolGray500" fontSize="$sm">
                {tab === 'mePrestaron' ? 'Registra lo que te prestaron.' : 'Registra lo que prestaste.'}
              </Text>
            </VStack>
            {loading && (
              <HStack space="$1" alignItems="center">
                <Spinner size="small" />
                <Text color="$coolGray500" fontSize="$xs">Cargando…</Text>
              </HStack>
            )}
          </HStack>

          {!loading && list.length === 0 ? (
            <Text color="$coolGray500" fontSize="$sm">No hay deudas en esta pestaña.</Text>
          ) : (
            <VStack space="$2">
              {list.map((item) => {
                const metodoId = Number(item.categori_metodos_id);
                const color = metodoId === 2 ? '$red600' : '$green600'; // 2 = Me prestaron (rojo), 1 = Prestó (verde)
                const amountAbs = Math.abs(Number(item.monto || 0));
                const isExpanded = expandedId === item.id;
                const metodoNombre = metodoNombreById(item.categori_metodos_id);

                return (
                  <Box
                    key={item.id}
                    bg="$white"
                    borderRadius="$lg"
                    p="$3"
                    borderWidth={1}
                    borderColor="$coolGray100"
                  >
                    {/* Fila principal: izquierda (icono + textos) / derecha (monto + menú + expand) */}
                    <HStack alignItems="center" justifyContent="space-between" space="$3">
                      {/* IZQUIERDA */}
                      <HStack alignItems="center" space="$3" flex={1}>
                        <Box
                          w={44}
                          h={44}
                          borderRadius="$full"
                          bg="$coolGray100"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon as={MaterialIcons} name="person-outline" size={22} color="$black" />
                        </Box>
                        <VStack flex={1}>
                          <Text fontWeight="$bold" color="$black" numberOfLines={1}>
                            {item.nombre || 'Deuda'}
                          </Text>
                          <Text color="$coolGray500" numberOfLines={1}>
                            {item.descripcion || '—'}
                          </Text>
                        </VStack>
                      </HStack>

                      {/* DERECHA */}
                      <HStack alignItems="center" space="$1.5" flexShrink={0}>
                        <Text color={color} fontWeight="$bold" textAlign="right" minW={100}>
                          {fmtMoney(amountAbs)}
                        </Text>

                        {/* Menú (tres puntitos) — sin fondo gris */}
                        <Popover
                          isOpen={openMenuId === item.id}
                          onClose={() => setOpenMenuId(null)}
                          placement="bottom right"
                          trigger={(triggerProps) => (
                            <Pressable
                              {...triggerProps}
                              onPress={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(item.id);
                              }}
                              rounded="$full"
                              p="$1"
                              hitSlop={8}
                            >
                              <Icon as={MaterialIcons} name="more-vert" size={22} color="$black" />
                            </Pressable>
                          )}
                        >
                          <PopoverBackdrop />
                          <PopoverContent w={200}>
                            <PopoverArrow />
                            <PopoverBody p={0}>
                              <VStack divider={<Divider bg="$coolGray100" />} space={0}>
                                <Pressable
                                  px="$4"
                                  py="$3"
                                  onPress={() => {
                                    setOpenMenuId(null);
                                    handleEdit(item);
                                  }}
                                >
                                  <HStack space="$2" alignItems="center">
                                    <Icon as={MaterialIcons} name="edit" size={20} color="$black" />
                                    <Text color="$black">Editar</Text>
                                  </HStack>
                                </Pressable>
                                <Pressable
                                  px="$4"
                                  py="$3"
                                  onPress={() => {
                                    setOpenMenuId(null);
                                    setConfirmDelete(item);
                                  }}
                                >
                                  <HStack space="$2" alignItems="center">
                                    <Icon as={MaterialIcons} name="delete-outline" size={20} color="$red600" />
                                    <Text color="$red600">Eliminar</Text>
                                  </HStack>
                                </Pressable>
                              </VStack>
                            </PopoverBody>
                          </PopoverContent>
                        </Popover>

                        {/* Expandir / contraer */}
                        <Pressable
                          onPress={() => setExpandedId(isExpanded ? null : item.id)}
                          hitSlop={8}
                        >
                          <Icon
                            as={MaterialIcons}
                            name={isExpanded ? 'expand-less' : 'expand-more'}
                            size={22}
                            color="$coolGray400"
                          />
                        </Pressable>
                      </HStack>
                    </HStack>

                    {/* Detalles expandibles */}
                    {isExpanded && (
                      <VStack mt="$3" space="$1">
                        <Text color="$coolGray500" fontSize="$xs">
                          Método: {metodoNombre}
                        </Text>
                        <Text color="$coolGray500" fontSize="$xs">
                          Fecha inicio{' '}
                          {item.fecha_inicio ? fmtDate(new Date(item.fecha_inicio)) : '—'}
                        </Text>
                        <Text color="$coolGray500" fontSize="$xs">
                          Fecha vencimiento{' '}
                          {item.fecha_vencimiento ? fmtDate(new Date(item.fecha_vencimiento)) : '—'}
                        </Text>
                      </VStack>
                    )}
                  </Box>
                );
              })}
            </VStack>
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

      {/* Modal: confirmar eliminar */}
      {confirmDelete && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0,0,0,0.35)"
          zIndex={200}
          alignItems="center"
          justifyContent="center"
        >
          <Box
            w="90%"
            maxW={420}
            bg="$white"
            p="$4"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$coolGray200"
          >
            <VStack space="$3">
              <HStack alignItems="center" space="$2">
                <Icon as={MaterialIcons} name="warning-amber" size={22} color="$red600" />
                <Text fontWeight="$bold" fontSize="$md" color="$black">Eliminar deuda</Text>
              </HStack>
              <Text color="$coolGray700" fontSize="$sm">
                ¿Seguro que deseas eliminar{' '}
                <Text fontWeight="$bold">{confirmDelete?.nombre || 'esta deuda'}</Text>?
              </Text>
              <HStack mt="$2" space="$2" justifyContent="flex-end">
                <Button
                  variant="outline"
                  borderColor="$coolGray300"
                  bg="$white"
                  onPress={() => setConfirmDelete(null)}
                >
                  <ButtonText color="$black">Cancelar</ButtonText>
                </Button>
                <Button bg="$red600" onPress={() => handleDelete(confirmDelete)}>
                  <ButtonText color="$white">Eliminar</ButtonText>
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}
    </>
  );

  // ===== Formulario =====
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
        <Pressable onPress={() => { setShowForm(false); setEditingId(null); }}>
          <HStack alignItems="center" space="$1.5">
            <Icon as={MaterialIcons} name="arrow-back-ios" size="md" color="$black" />
            <Text color="$black">Regresar</Text>
          </HStack>
        </Pressable>
      </HStack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Box bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$coolGray200" p="$4">
          <Text fontWeight="$bold" fontSize="$xl" color="$black" mb="$1">
            {tab === 'mePrestaron' ? 'Me prestaron' : 'Prestó'}
          </Text>
          <Text color="$coolGray500" fontSize="$sm" mb="$4">
            {tab === 'mePrestaron'
              ? 'Registra lo que te prestaron (se agrupa por método id=2).'
              : 'Registra lo que prestaste (se agrupa por método id=1).'}
          </Text>

          <VStack space="$4">
            {/* Nombre */}
            <FormControl isRequired isInvalid={!form.nombre.trim()}>
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
                  placeholder="¿Con quién es la deuda?"
                  value={form.nombre}
                  onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
                  maxLength={32}
                />
              </Input>
              <Text color="$coolGray400" fontSize="$xs" textAlign="right">
                {form.nombre.length}/32
              </Text>
              {!form.nombre.trim() && (
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
                  placeholder="Descripción breve"
                  value={form.descripcion}
                  onChangeText={(v) => setForm((f) => ({ ...f, descripcion: v }))}
                  maxLength={40}
                />
              </Input>
              <Text color="$coolGray400" fontSize="$xs" textAlign="right">
                {form.descripcion.length}/40
              </Text>
            </FormControl>

            {/* Método (categoria_metodos) */}
            <FormControl isRequired isInvalid={!form.metodoId}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">
                  Método
                </FormControlLabelText>
              </FormControlLabel>
              <Select
                selectedValue={form.metodoId}
                onValueChange={(v) => setForm((f) => ({ ...f, metodoId: v }))}
              >
                <SelectTrigger borderColor="$coolGray300" bg="$white">
                  <SelectInput
                    placeholder="Selecciona el método"
                    value={metodoNombreById(form.metodoId)}
                  />
                  <SelectIcon as={MaterialIcons} name="expand-more" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {/* Si no hay catálogo aún, mostramos 1 y 2 */}
                    {(metodos.length ? metodos : [{ id: 1, nombre: 'Prestó' }, { id: 2, nombre: 'Me prestaron' }]).map((m) => (
                      <SelectItem key={m.id} label={m.nombre} value={String(m.id)} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
              {!form.metodoId && (
                <FormControlError>
                  <FormControlErrorText>Selecciona un método.</FormControlErrorText>
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

            {/* Guardar */}
            <Button
              bg="$red600"
              borderRadius="$xl"
              h="$12"
              mt="$4"
              onPress={handleSave}
              isDisabled={!isValid || saving}
              opacity={isValid && !saving ? 1 : 0.6}
            >
              <ButtonText fontSize="$lg" fontWeight="$semibold" color="$white">
                {editingId ? 'Guardar cambios' : 'Guardar'}
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
      <Box flex={1} bg="$white" position="relative">
        {showForm ? renderForm() : renderList()}

        {/* Overlay inicial (pantalla completa) */}
        {initialLoading && <FullScreenLoader text="Cargando…" />}

        {/* Overlay de guardado (pantalla completa) */}
        {saving && <FullScreenLoader text="Guardando…" />}
      </Box>
    </SafeAreaView>
  );
}
