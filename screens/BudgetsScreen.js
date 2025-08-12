import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, ScrollView, Pressable, Divider, ButtonText,
  Input, InputField, InputSlot, InputIcon,
  FormControl, FormControlLabel, FormControlLabelText, FormControlHelper, FormControlHelperText,
  FormControlError, FormControlErrorText,
  Popover, PopoverBackdrop, PopoverContent, PopoverArrow, PopoverBody,
  AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
  Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectItem,
  Spinner
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import AppMenuPopover from '../components/AppMenuPopover';

// API
import {
  getCategorias,
  getPresupuestos,         // <- USAMOS SIEMPRE ESTE
  postPresupuesto,
  putPresupuesto,
  deletePresupuesto,
} from '../api';

const MONTHS = [
  { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
  { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
  { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
];

const now = new Date();
const defaultMonth = String(now.getMonth() + 1);
const defaultYear = String(now.getFullYear());

const moneyOk = (v) => /^(\d+)([.,]\d{1,2})?$/.test(String(v).replace(',', '.'));
const toNumber = (v, def = 0) => {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : def;
};

export default function BudgetsScreen({
  token,
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
  onProfile = () => {},
}) {
  const [showPopover, setShowPopover] = useState(false);

  // filtros
  const [filterMonth, setFilterMonth] = useState(defaultMonth);
  const [filterYear, setFilterYear] = useState(defaultYear);

  // data
  const [categorias, setCategorias] = useState([]);
  const [allBudgets, setAllBudgets] = useState([]); // SIEMPRE guardamos todo lo que devuelve la API
  const [loading, setLoading] = useState(true);

  // form
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: '',
    categorias_id: '',
    monto_limite: '',
    mes: defaultMonth,
    ano: defaultYear,
  });
  const [editingId, setEditingId] = useState(null);

  // eliminar
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const cancelRef = useRef(null);

  // === helpers de normalización ===
  const normalizeBudget = (b) => ({
    ...b,
    id: b.id,
    categorias_id: Number(b.categorias_id),
    monto_limite: toNumber(b.monto_limite),
    mes: Number(b.mes),
    ano: Number(b.ano),
    // si algún día el backend envía gasto: lo intentamos detectar
    spent: toNumber(b.gasto_total ?? b.monto_gastado ?? b.gastado ?? 0),
  });

  const categoryName = (id) =>
    categorias.find((c) => String(c.id) === String(id))?.nombre || `Categoría #${id}`;

  const list = useMemo(() => {
    const m = Number(filterMonth);
    const y = Number(filterYear);
    return allBudgets
      .filter((b) => Number(b.mes) === m && Number(b.ano) === y)
      .sort((a, b) => String(categoryName(a.categorias_id)).localeCompare(String(categoryName(b.categorias_id))));
  }, [allBudgets, filterMonth, filterYear, categorias]);

  const errors = useMemo(() => {
    const e = {};
    if (!form.categorias_id) e.categorias_id = 'Selecciona una categoría.';
    if (!form.monto_limite || !moneyOk(form.monto_limite)) e.monto_limite = 'Monto inválido (ej. 1500 o 1500.50).';
    const m = Number(form.mes);
    const y = Number(form.ano);
    if (!(m >= 1 && m <= 12)) e.mes = 'Mes inválido (1-12).';
    if (!(y >= 2020)) e.ano = 'Año inválido (>=2020).';
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  // === carga inicial ===
  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const [cats, budgets] = await Promise.all([
          getCategorias(token).catch(() => []),
          getPresupuestos(token).catch(() => []),
        ]);
        setCategorias(Array.isArray(cats) ? cats : []);
        const normalized = (Array.isArray(budgets) ? budgets : []).map(normalizeBudget);
        setAllBudgets(normalized);
      } catch (e) {
        console.error('Carga inicial falló:', e?.message || e);
        setCategorias([]);
        setAllBudgets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // === UI comunes ===
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

  const FiltersBar = () => (
    <HStack px="$6" py="$2" space="$3" alignItems="center">
      {/* Mes */}
      <Box flex={1}>
        <FormControl>
          <FormControlLabel>
            <FormControlLabelText color="$black" fontWeight="$bold">Mes</FormControlLabelText>
          </FormControlLabel>
          <Select selectedValue={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger borderColor="$coolGray300" bg="$white">
              <SelectInput placeholder="Mes" />
              <SelectIcon as={MaterialIcons} name="expand-more" />
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                {MONTHS.map(m => (
                  <SelectItem key={m.value} label={m.label} value={String(m.value)} />
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
        </FormControl>
      </Box>

      {/* Año */}
      <Box width={140}>
        <FormControl>
          <FormControlLabel>
            <FormControlLabelText color="$black" fontWeight="$bold">Año</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="calendar-today" /></InputSlot>
            <InputField
              placeholder="2025"
              value={filterYear}
              onChangeText={setFilterYear}
              keyboardType="numeric"
              maxLength={4}
            />
          </Input>
        </FormControl>
      </Box>

      <Button
        variant="outline"
        borderColor="$coolGray300"
        onPress={async () => {
          setLoading(true);
          try {
            const budgets = await getPresupuestos(token);
            setAllBudgets((Array.isArray(budgets) ? budgets : []).map(normalizeBudget));
          } catch (e) {
            console.error('Actualizar falló:', e?.message || e);
            alert('No se pudieron recargar los presupuestos');
          } finally {
            setLoading(false);
          }
        }}
        isDisabled={loading}
      >
        <ButtonText>{loading ? 'Cargando…' : 'Actualizar'}</ButtonText>
      </Button>
    </HStack>
  );

  // === acciones ===
  const openCreate = () => {
    setForm({
      id: '',
      categorias_id: '',
      monto_limite: '',
      mes: filterMonth,
      ano: filterYear,
    });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({
      id: String(item.id),
      categorias_id: String(item.categorias_id),
      monto_limite: String(item.monto_limite),
      mes: String(item.mes),
      ano: String(item.ano),
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
      // optimista: quitar de la lista global
      setAllBudgets(prev => prev.filter(b => String(b.id) !== String(toDelete.id)));
      setConfirmOpen(false);
      setToDelete(null);
    } catch (e) {
      console.error('Error eliminando presupuesto:', e?.message || e);
      alert('No se pudo eliminar el presupuesto');
    }
  };

  const saveBudget = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const payload = {
        categorias_id: Number(form.categorias_id),
        monto_limite: toNumber(form.monto_limite),
        mes: Number(form.mes),
        ano: Number(form.ano),
      };

      if (editingId) {
        const updated = await putPresupuesto(editingId, payload, token);
        const normalized = normalizeBudget(updated);
        // optimista: reemplazar en allBudgets (aunque cambie mes/año)
        setAllBudgets(prev => {
          const other = prev.filter(b => String(b.id) !== String(normalized.id));
          return [normalized, ...other];
        });

        // si cambió de período, nos movemos a mostrarlo
        if (String(filterMonth) !== String(normalized.mes) || String(filterYear) !== String(normalized.ano)) {
          setFilterMonth(String(normalized.mes));
          setFilterYear(String(normalized.ano));
        }
      } else {
        const created = await postPresupuesto(payload, token);
        const normalized = normalizeBudget(created);

        // algunos backends responden sin mes/ano correctos -> forzar con payload
        if (!normalized.mes) normalized.mes = payload.mes;
        if (!normalized.ano) normalized.ano = payload.ano;

        // optimista: agregar a allBudgets
        setAllBudgets(prev => [normalized, ...prev]);

        // si el nuevo no cae en el período visible, cambia filtros para verlo
        if (String(filterMonth) !== String(normalized.mes) || String(filterYear) !== String(normalized.ano)) {
          setFilterMonth(String(normalized.mes));
          setFilterYear(String(normalized.ano));
        }
      }

      setShowForm(false);
      setEditingId(null);
    } catch (e) {
      console.error('Error guardando presupuesto:', e?.message || e);
      alert('No se pudo guardar el presupuesto');
    } finally {
      setSaving(false);
    }
  };

  // === acciones de tarjeta ===
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
        <PopoverContent w={220} maxW={250} p="$0">
          <PopoverArrow />
          <PopoverBody p="$0">
            <VStack divider={<Box h={1} bg="$coolGray100" />}>
              <ItemRow icon="edit" label="Editar presupuesto" onPress={() => openEdit(item)} />
              <ItemRow icon="delete-outline" label="Eliminar" danger onPress={() => askDelete(item)} />
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  };

  // === vistas ===
  const renderList = () => (
    <>
      <Header title="Presupuestos" />
      <Divider bg="$coolGray200" />
      <FiltersBar />

      <ScrollView px="$6" py="$4" contentContainerStyle={{ paddingBottom: 96 }}>
        {loading && (
          <HStack space="$2" alignItems="center" mb="$3">
            <Spinner />
            <Text color="$coolGray500">Cargando…</Text>
          </HStack>
        )}

        {!loading && list.length === 0 && (
          <Text color="$coolGray500" fontSize="$sm">No hay presupuestos para este mes/año.</Text>
        )}

        {list.map((b) => {
          const spent = toNumber(b.spent);                    // puede ser 0 si la API no lo envía
          const limit = toNumber(b.monto_limite);
          const exceeded = limit > 0 && spent > limit;
          const pct = limit > 0 ? Math.max(0, Math.min(100, Math.round((spent / limit) * 100))) : 0;

          return (
            <Box
              key={b.id}
              mb="$4"
              p="$4"
              borderRadius="$xl"
              borderWidth={1}
              borderColor={exceeded ? '$red600' : '$coolGray200'}
              bg={exceeded ? '$red100' : '$white'}
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
                {/* Izquierda */}
                <VStack flex={1} minW={0}>
                  <Text fontWeight="$bold" color="$black" numberOfLines={1} ellipsizeMode="tail">
                    {categoryName(b.categorias_id)}
                  </Text>
                  <Text color="$coolGray600" fontSize="$xs" flexShrink={1}>
                    {MONTHS.find(m => m.value === Number(b.mes))?.label || `Mes ${b.mes}`} · {b.ano}
                  </Text>
                </VStack>

                {/* Derecha */}
                <HStack space="$3" alignItems="flex-start" maxW={220}>
                  <VStack alignItems="flex-end" flexShrink={1}>
                    <Text color={exceeded ? '$red600' : '$black'} numberOfLines={1} ellipsizeMode="tail">
                      MXN {spent.toLocaleString('es-MX')} / {limit.toLocaleString('es-MX')}
                    </Text>
                    <Text fontSize="$xs" color="$coolGray500" textAlign="right" numberOfLines={1}>
                      {exceeded ? 'Excedido' : 'En curso'}
                    </Text>
                  </VStack>
                  <CardActions item={b} />
                </HStack>
              </HStack>

              {/* Barra de progreso */}
              <Box bg="$coolGray200" h={10} borderRadius="$lg" overflow="hidden">
                <Box bg={exceeded ? '$red600' : '#2D2DAA'} h="100%" w={`${pct}%`} />
              </Box>
            </Box>
          );
        })}
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
              ¿Eliminar el presupuesto de <Text fontWeight="$bold">{categoryName(toDelete?.categorias_id)}</Text> ({toDelete?.mes}/{toDelete?.ano})?
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
    </>
  );

  const renderForm = () => (
    <Box flex={1} bg="$white">
      {/* Header del formulario */}
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
        <Pressable disabled={!isValid || saving} onPress={saveBudget} opacity={isValid && !saving ? 1 : 0.4}>
          {saving ? <Spinner /> : <Icon as={MaterialIcons} name="check" size="xl" color="$black" />}
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
            {/* Categoría (desde API) */}
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
                    {categorias.map((c) => (
                      <SelectItem key={c.id} label={c.nombre} value={String(c.id)} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
              {!errors.categorias_id ? (
                <FormControlHelper>
                  <FormControlHelperText>El presupuesto aplica por categoría.</FormControlHelperText>
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

            {/* Mes */}
            <FormControl isInvalid={!!errors.mes}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Mes</FormControlLabelText>
              </FormControlLabel>
              <Select
                selectedValue={form.mes}
                onValueChange={(v) => setForm((f) => ({ ...f, mes: v }))}
              >
                <SelectTrigger borderColor="$coolGray300" bg="$white">
                  <SelectInput placeholder="Mes (1–12)" />
                  <SelectIcon as={MaterialIcons} name="expand-more" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} label={m.label} value={String(m.value)} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
              {!!errors.mes && (
                <FormControlError mt="$1">
                  <FormControlErrorText>{errors.mes}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Año */}
            <FormControl isInvalid={!!errors.ano}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Año</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="calendar-today" /></InputSlot>
                <InputField
                  placeholder="2025"
                  value={form.ano}
                  onChangeText={(v) => setForm((f) => ({ ...f, ano: v }))}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </Input>
              {!!errors.ano && (
                <FormControlError mt="$1">
                  <FormControlErrorText>{errors.ano}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <Button
              bg="$red600"
              borderRadius="$xl"
              h="$12"
              mt="$2"
              onPress={saveBudget}
              isDisabled={!isValid || saving}
              opacity={isValid && !saving ? 1 : 0.6}
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
      <Box flex={1} bg="$white">
        {showForm ? renderForm() : renderList()}
      </Box>
    </SafeAreaView>
  );
}
