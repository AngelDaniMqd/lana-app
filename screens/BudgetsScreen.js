import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import {
  Box, VStack, HStack, Text, Button, Icon, ScrollView, Pressable, Divider, ButtonText, Badge, BadgeText,
  Input, InputField, InputSlot, InputIcon,
  Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectItem,
  FormControl, FormControlLabel, FormControlLabelText, FormControlHelper, FormControlHelperText,
  FormControlError, FormControlErrorText,
  Popover, PopoverBackdrop, PopoverContent, PopoverArrow, PopoverBody,
  AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
  Spinner
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import AppMenuPopover from '../components/AppMenuPopover';

// API
import {
  getPresupuestos,
  postPresupuesto,
  putPresupuesto,
  deletePresupuesto,
  patchPresupuestoEstado,
  getCategorias,
} from '../api';

const TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'activos', label: 'Activos' },
  { key: 'inactivos', label: 'Inactivos' },
];

const moneyRegex = /^\d+([.,]\d{1,2})?$/;

export default function BudgetsScreen({
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
  const [tab, setTab] = useState('todos');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [budgets, setBudgets] = useState([]); // {categoria_nombre, gastado, porcentaje_usado, excedido, estado, ...}
  const [categories, setCategories] = useState([]);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    categorias_id: '',
    monto_limite: '',
  });

  // Confirmación de eliminación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const cancelRef = useRef(null);

  // Modal de error (duplicados u otros)
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ===== Fetch =====
  const loadData = async () => {
    setLoading(true);
    try {
      const [pres, cats] = await Promise.all([
        getPresupuestos(token),
        getCategorias(token),
      ]);
      setBudgets(Array.isArray(pres) ? pres : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch {
      setBudgets([]);
      setCategories([]);
      setErrorMsg('No se pudieron cargar presupuestos.');
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  // ===== Duplicado (activo) =====
  const duplicateActive = useMemo(() => {
    if (!form.categorias_id) return false;
    const catIdNum = Number(form.categorias_id);
    return budgets.some(
      (b) =>
        String(b.estado) === 'activo' &&
        Number(b.categorias_id) === catIdNum &&
        (editingId ? b.id !== editingId : true)
    );
  }, [form.categorias_id, budgets, editingId]);

  // ===== Helpers =====
  const filteredBudgets = useMemo(() => {
    if (tab === 'activos') return budgets.filter(b => String(b.estado) === 'activo');
    if (tab === 'inactivos') return budgets.filter(b => String(b.estado) === 'inactivo');
    return budgets;
  }, [budgets, tab]);

  const errors = useMemo(() => {
    const e = {};
    if (!form.categorias_id) {
      e.categorias_id = 'Selecciona una categoría.';
    } else if (duplicateActive) {
      e.categorias_id = 'Ya existe un presupuesto activo para esta categoría.';
    }
    if (!form.monto_limite || !moneyRegex.test(String(form.monto_limite).replace(',', '.')))
      e.monto_limite = 'Monto inválido (ej. 1500 o 1500.50).';
    return e;
  }, [form, duplicateActive]);

  const isValid = Object.keys(errors).length === 0;

  const openCreate = () => {
    setForm({ categorias_id: '', monto_limite: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({
      categorias_id: String(item.categorias_id),
      monto_limite: String(item.monto_limite),
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const askDelete = (item) => {
    setToDelete(item);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    try {
      await deletePresupuesto(toDelete.id, token);
      setConfirmOpen(false);
      setToDelete(null);
      await loadData();
    } catch {
      setErrorMsg('No se pudo eliminar el presupuesto.');
      setErrorOpen(true);
    }
  };

  const toggleEstado = async (item) => {
    try {
      const newEstado = String(item.estado) === 'activo' ? 'inactivo' : 'activo';
    await patchPresupuestoEstado(item.id, newEstado, token);
      await loadData();
    } catch {
      setErrorMsg('No se pudo cambiar el estado del presupuesto.');
      setErrorOpen(true);
    }
  };

  const saveBudget = async () => {
    // ✅ Validación inmediata al click (antes de cualquier request)
    if (duplicateActive) {
      setErrorMsg('Ya existe un presupuesto activo para esta categoría.');
      setErrorOpen(true);
      return;
    }
    if (!isValid) return;

    setSaving(true);
    try {
      const catId = Number(form.categorias_id);
      const monto = Number(String(form.monto_limite).replace(',', '.'));

      if (editingId) {
        // EDITAR: no mandamos estado para no reactivarlo accidentalmente
        await putPresupuesto(editingId, { categorias_id: catId, monto_limite: monto }, token);
      } else {
        // CREAR: siempre activo por defecto
        await postPresupuesto({ categorias_id: catId, monto_limite: monto, estado: 'activo' }, token);
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ categorias_id: '', monto_limite: '' });
      await loadData();
    } catch (e) {
      let msg = 'No se pudo guardar el presupuesto.';
      if (e && typeof e.message === 'string') {
        try {
          const j = JSON.parse(e.message);
          if (j?.detail) msg = String(j.detail);
        } catch {
          if (e.message.includes('Ya existe')) msg = e.message;
        }
      }
      setErrorMsg(msg);
      setErrorOpen(true);
    } finally {
      setSaving(false);
    }
  };

  // ===== UI =====
  const Header = ({ title }) => (
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
      <Text fontSize="$2xl" fontWeight="$bold" color="$black">{title}</Text>
      <Pressable rounded="$full" p="$2" bg="$coolGray100" onPress={onNotifications}>
        <Icon as={MaterialIcons} name="notifications-none" size={24} color="$black" />
      </Pressable>
    </HStack>
  );

  const CardActions = ({ item }) => {
    const [open, setOpen] = useState(false);
    const ItemRow = ({ icon, label, onPress, danger }) => (
      <Pressable px="$4" py="$3" onPress={() => { setOpen(false); onPress(); }}>
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
        placement="bottom right"
        trigger={(triggerProps = {}) => (
          <Pressable
            {...triggerProps}
            onPress={() => setOpen(true)}
            rounded="$md"
            bg="$transparent"
            borderWidth={1}
            borderColor="$transparent"
            px="$1"
            py="$1"
            alignSelf="flex-start"
          >
            <Icon as={MaterialIcons} name="more-vert" size={20} color="$black" />
          </Pressable>
        )}
      >
        <PopoverBackdrop />
        <PopoverContent w={240} p="$0">
          <PopoverArrow />
          <PopoverBody p="$0">
            <VStack divider={<Box h={1} bg="$coolGray100" />}>
              <ItemRow icon="edit" label="Editar presupuesto" onPress={() => openEdit(item)} />
              <ItemRow
                icon={String(item.estado) === 'activo' ? 'toggle-off' : 'toggle-on'}
                label={String(item.estado) === 'activo' ? 'Marcar como inactivo' : 'Marcar como activo'}
                onPress={() => toggleEstado(item)}
              />
              <ItemRow icon="delete-outline" label="Eliminar" danger onPress={() => askDelete(item)} />
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  };

  const BudgetCard = ({ b }) => {
    const pct = Math.max(0, Math.min(100, Math.round(Number(b.porcentaje_usado || 0))));
    const exceeded = Boolean(b.excedido);
    const near = !exceeded && pct >= 80;

    const barColor = exceeded ? '$red600' : near ? '$amber600' : '#2D2DAA';
    const bgColor = exceeded ? '$red100' : near ? '$amber100' : '$white';
    const borderColor = exceeded ? '$red600' : near ? '$amber600' : '$coolGray200';

    return (
      <Box
        key={b.id}
        mb="$4"
        p="$4"
        borderRadius="$xl"
        borderWidth={1}
        borderColor={borderColor}
        bg={bgColor}
        overflow="hidden"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }}
      >
        <HStack justifyContent="space-between" alignItems="flex-start" space="$3" mb="$2">
          <VStack flex={1} minW={0}>
            <HStack alignItems="center" space="$2">
              <Text fontWeight="$bold" color="$black" numberOfLines={1} ellipsizeMode="tail">
                {b.categoria_nombre || 'Categoría'}
              </Text>
              <Badge
                variant="solid"
                bg={String(b.estado) === 'activo' ? '$emerald600' : '$coolGray500'}
                borderRadius="$full"
              >
                <BadgeText color="$white" fontSize="$xs">
                  {String(b.estado) === 'activo' ? 'Activo' : 'Inactivo'}
                </BadgeText>
              </Badge>
            </HStack>
            <Text color="$coolGray600" fontSize="$xs">
              Límite: MXN {Number(b.monto_limite || 0).toLocaleString('es-MX')}
            </Text>
          </VStack>

          <HStack space="$3" alignItems="flex-start" maxW={220}>
            <VStack alignItems="flex-end" flexShrink={1}>
              <Text color={exceeded ? '$red600' : near ? '$amber700' : '$black'} numberOfLines={1}>
                Gastado: MXN {Number(b.gastado || 0).toLocaleString('es-MX')}
              </Text>
              <Text fontSize="$xs" color="$coolGray500" textAlign="right" numberOfLines={1}>
                {exceeded ? 'Excedido' : near ? 'Cerca de exceder' : 'En curso'} · {pct}%
              </Text>
            </VStack>
            <CardActions item={b} />
          </HStack>
        </HStack>

        {/* Barra de progreso */}
        <Box bg="$coolGray200" h={10} borderRadius="$lg" overflow="hidden">
          <Box bg={barColor} h="100%" w={`${pct}%`} />
        </Box>
      </Box>
    );
  };

  const renderList = () => (
    <>
      <Header title="Presupuestos" />
      <Divider bg="$coolGray200" />

      {/* Tabs de filtro */}
      <HStack px="$6" py="$2" alignItems="center" justifyContent="center" space="$3">
        {TABS.map(t => {
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

      <ScrollView px="$6" py="$4" contentContainerStyle={{ paddingBottom: 96 }}>
        {loading ? (
          <HStack space="$2" alignItems="center">
            <Spinner />
            <Text color="$coolGray500">Cargando…</Text>
          </HStack>
        ) : filteredBudgets.length === 0 ? (
          <Text color="$coolGray500">No hay presupuestos para mostrar.</Text>
        ) : (
          filteredBudgets.map((b) => <BudgetCard key={b.id} b={b} />)
        )}
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
          onPress={openCreate}
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

      {/* Modal confirmar eliminar */}
      <AlertDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} leastDestructiveRef={cancelRef}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Text fontWeight="$bold" color="$black">Confirmar eliminación</Text>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text>
              ¿Eliminar el presupuesto de{' '}
              <Text fontWeight="$bold">{toDelete?.categoria_nombre || 'Categoría'}</Text>? Esta acción no se puede deshacer.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack space="$2">
              <Button variant="outline" action="secondary" ref={cancelRef} onPress={() => setConfirmOpen(false)}>
                <ButtonText>Cancelar</ButtonText>
              </Button>
              <Button bg="$red600" action="negative" onPress={doDelete}>
                <ButtonText color="$white">Eliminar</ButtonText>
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de error (duplicados / backend) */}
      <AlertDialog isOpen={errorOpen} onClose={() => setErrorOpen(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Text fontWeight="$bold" color="$black">Aviso</Text>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text>{errorMsg || 'Ocurrió un error.'}</Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button onPress={() => setErrorOpen(false)}>
              <ButtonText>Aceptar</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  const renderForm = () => (
    <Box flex={1} bg="$white">
      {/* Header formulario */}
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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <VStack space="$2" mb="$2">
          <Text fontWeight="$bold" fontSize={20} color="$black">
            {editingId ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          </Text>
          <Text color="$coolGray600" fontSize={12}>
            Completa los datos para {editingId ? 'actualizar' : 'crear'} tu presupuesto.
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
            {/* Categoría */}
            <FormControl isInvalid={!!errors.categorias_id}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Categoría</FormControlLabelText>
              </FormControlLabel>

              <Select
                selectedValue={form.categorias_id}
                onValueChange={(v) => setForm((f) => ({ ...f, categorias_id: v }))}
              >
                <SelectTrigger borderColor="$coolGray300" bg="$white">
                  <SelectInput placeholder="Selecciona una categoría" />
                  <SelectIcon as={MaterialIcons} name="expand-more" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} label={c.descripcion} value={String(c.id)} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>

              {!errors.categorias_id ? (
                <FormControlHelper>
                  <FormControlHelperText>El presupuesto se aplica a esta categoría.</FormControlHelperText>
                </FormControlHelper>
              ) : (
                <FormControlError mt="$1">
                  <FormControlErrorText>{errors.categorias_id}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Monto límite */}
            <FormControl isInvalid={!!errors.monto_limite}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Monto límite</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="attach-money" /></InputSlot>
                <InputField
                  placeholder="MXN 0.00"
                  value={form.monto_limite}
                  onChangeText={(v) => setForm((f) => ({ ...f, monto_limite: v }))}
                  keyboardType="numeric"
                  maxLength={12}
                />
              </Input>
              {!errors.monto_limite ? (
                <FormControlHelper>
                  <FormControlHelperText>Solo números, hasta 2 decimales.</FormControlHelperText>
                </FormControlHelper>
              ) : (
                <FormControlError mt="$1">
                  <FormControlErrorText>{errors.monto_limite}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <Button
              bg="$red600"
              borderRadius="$xl"
              h="$12"
              mt="$2"
              onPress={saveBudget}
              isDisabled={!isValid || saving || duplicateActive}  // ⛔ deshabilita en duplicado
              opacity={isValid && !saving && !duplicateActive ? 1 : 0.6}
            >
              <ButtonText fontSize="$lg" fontWeight="$semibold" color="$white">
                {editingId ? 'Guardar cambios' : 'Guardar presupuesto'}
              </ButtonText>
            </Button>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <Box flex={1} bg="$white" position="relative">
        {showForm ? renderForm() : renderList()}

        {/* Overlay guardando */}
        {saving && (
          <Box
            position="absolute"
            style={StyleSheet.absoluteFillObject}
            bg="rgba(255,255,255,0.5)"
            zIndex={999}
            alignItems="center"
            justifyContent="center"
          >
            <Spinner size="large" color="$red600" />
            <Text mt="$2" color="$red600">Guardando…</Text>
          </Box>
        )}
      </Box>
    </SafeAreaView>
  );
}
