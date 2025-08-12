// screens/RecordsScreen.jsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, ScrollView, Pressable, ButtonText, Divider,
  Badge, BadgeText, Spinner, Popover, PopoverBackdrop, PopoverContent, PopoverArrow, PopoverBody,
  Input, InputField, InputSlot, InputIcon,
  FormControl, FormControlLabel, FormControlLabelText, FormControlError, FormControlErrorText,
  Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop,
  SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem
} from '@gluestack-ui/themed';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AppMenuPopover from '../components/AppMenuPopover';
import {
  getRegistros, getCuentas, getSubcategorias, getCategorias,
  deleteRegistro, putRegistro
} from '../api';

// ===== Helpers
const fmtMoney2 = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return `MXN ${Math.abs(num).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
};
const signColor = (n) => (Number(n) < 0 ? '$red600' : '$green600');
const signed = (n) => (Number(n) < 0 ? `- ${fmtMoney2(n)}` : `+ ${fmtMoney2(n)}`);
const dateOnly = (iso) => {
  try { return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' }); }
  catch { return String(iso).split('T')[0] || '—'; }
};
const validAmount = (v) => /^-?\d+([.,]\d{1,2})?$/.test(String(v).trim());

// ===== Filtros de rango
const FILTERS = ['7 días', '30 días', '12 Semanas', '6 Meses'];
const rangeForFilter = (label) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = label === '7 días' ? 7 : label === '30 días' ? 30 : label === '12 Semanas' ? (12 * 7) : 180;
  const from = new Date(today.getTime() - (days - 1) * 86400000);
  return { from, to: today };
};

function BottomFilters({ active, onChange }) {
  return (
    <Box borderTopWidth={1} borderColor="$coolGray200" bg="$white" px="$5" py="$3" mt="$4" mb="$6">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
        <HStack space="$3" alignItems="center">
          {FILTERS.map((label) => {
            const selected = active === label;
            return (
              <Button
                key={label}
                onPress={() => onChange(label)}
                bg={selected ? '$black' : '$white'}
                variant={selected ? 'solid' : 'outline'}
                borderColor="$coolGray300"
                borderRadius="$xl"
                minW={120}
                h={46}
                px="$5"
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
  token,
  user,
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

  // Catálogos
  const [cuentas, setCuentas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcats, setSubcats] = useState([]);

  // Registros
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI lista
  const [activeFilter, setActiveFilter] = useState(FILTERS[1]); // 30 días por defecto
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // UI formulario edición
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    monto: '',
    lista_cuentas_id: '',
    categoria_id: '',
    subCategorias_id: '',
  });

  const abortRef = useRef(null);

  // Load data
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMsg('No hay sesión activa. Inicia sesión para ver tus registros.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const [rC, rCat, rS, rR] = await Promise.allSettled([
          getCuentas(token),
          getCategorias(token),
          getSubcategorias(token),
          getRegistros(token),
        ]);

        if (controller.signal.aborted) return;

        setCuentas(rC.status === 'fulfilled' ? rC.value : []);
        setCategorias(rCat.status === 'fulfilled' ? rCat.value : []);
        setSubcats(rS.status === 'fulfilled' ? rS.value : []);
        setRegistros(rR.status === 'fulfilled' ? (Array.isArray(rR.value) ? rR.value : []) : []);

        if (rC.status === 'rejected' || rCat.status === 'rejected' || rS.status === 'rejected' || rR.status === 'rejected') {
          setErrorMsg('Algunos datos no se pudieron cargar. Intenta recargar.');
        }
      } catch {
        if (!controller.signal.aborted) setErrorMsg('Error al conectar con el servidor.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [token]);

  // Mapas para labels
  const cuentasMap = useMemo(() => {
    const m = new Map();
    cuentas.forEach(c => m.set(String(c.id), c.nombre));
    return m;
  }, [cuentas]);

  const categoriasMap = useMemo(() => {
    const m = new Map();
    categorias.forEach(c => m.set(String(c.id), c.descripcion));
    return m;
  }, [categorias]);

  const subcatsMap = useMemo(() => {
    const m = new Map();
    subcats.forEach(s => m.set(String(s.id), s.descripcion));
    return m;
  }, [subcats]);

  // Subcats por categoría seleccionada (en el form)
  const filteredSubcats = useMemo(() => {
    if (!form.categoria_id) return [];
    return subcats.filter(s => String(s.categorias_id) === String(form.categoria_id));
  }, [subcats, form.categoria_id]);

  // Filtrado por rango
  const { from, to } = useMemo(() => rangeForFilter(activeFilter), [activeFilter]);

  const filtered = useMemo(() => {
    if (!Array.isArray(registros)) return [];
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
    return registros
      .filter(r => {
        const d = new Date(r.fecha_registro);
        const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        return day >= start && day <= end;
      })
      .sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
  }, [registros, from, to]);

  // Agrupar por día
  const sections = useMemo(() => {
    const map = new Map();
    for (const r of filtered) {
      const key = dateOnly(r.fecha_registro);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    const arr = Array.from(map.entries()).map(([date, items]) => {
      const total = items.reduce((acc, it) => acc + Number(it.monto || 0), 0);
      return { date, items, total };
    });
    arr.sort((a, b) => new Date(b.items[0].fecha_registro) - new Date(a.items[0].fecha_registro));
    return arr;
  }, [filtered]);

  const refresh = async () => {
    if (!token) return;
    try {
      const fresh = await getRegistros(token);
      setRegistros(Array.isArray(fresh) ? fresh : []);
    } catch {
      setErrorMsg('No se pudieron refrescar los registros.');
    }
  };

  // === Edición ===
  const startEdit = (r) => {
    // Derivar categoría desde la subcategoría actual
    const sub = subcats.find(s => String(s.id) === String(r.subCategorias_id));
    const derivedCategoriaId = sub ? String(sub.categorias_id) : '';
    setEditingId(r.id);
    setForm({
      monto: String(r.monto ?? ''),
      lista_cuentas_id: String(r.lista_cuentas_id ?? ''),
      categoria_id: derivedCategoriaId,
      subCategorias_id: String(r.subCategorias_id ?? ''),
    });
    setShowForm(true);
    setOpenMenuId(null);
  };

  const isValid =
    String(form.monto).trim() &&
    validAmount(form.monto) &&
    String(form.lista_cuentas_id).trim() &&
    String(form.categoria_id).trim() &&
    String(form.subCategorias_id).trim();

  const handleSave = async () => {
    if (!isValid || !editingId || !token) return;
    setSaving(true);
    try {
      await putRegistro(
        editingId,
        {
          lista_cuentas_id: form.lista_cuentas_id,
          subCategorias_id: form.subCategorias_id,
          monto: String(form.monto).replace(',', '.'),
        },
        token
      );
      await refresh();
      setShowForm(false);
      setEditingId(null);
    } catch {
      alert('No se pudo actualizar el registro');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (r) => {
    setConfirmDelete(r);
    setOpenMenuId(null);
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteRegistro(confirmDelete.id, token);
      setConfirmDelete(null);
      await refresh();
    } catch {
      alert('No se pudo eliminar el registro');
    }
  };

  // ===== Vista Lista =====
  const renderList = () => (
    <>
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
          user={user}
          token={token}
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
        <Text fontSize={24} fontWeight="$bold" color="$black">
          Registros
        </Text>
        <Pressable rounded="$full" p="$2" onPress={onNotifications}>
          <Icon as={MaterialIcons} name="notifications-none" size={24} color="$black" />
        </Pressable>
      </HStack>

      {/* Encabezado rango / estado */}
      <HStack px="$5" pt="$3" pb="$2" alignItems="center" justifyContent="space-between">
        <Text color="$coolGray600" fontSize="$xs">
          {`${dateOnly(from)} → ${dateOnly(to)}`}
        </Text>
        {!loading && !!errorMsg && (
          <Text color="$red600" fontSize="$xs" numberOfLines={1}>
            {errorMsg}
          </Text>
        )}
        {loading && (
          <HStack space="$1" alignItems="center">
            <Spinner size="small" />
            <Text color="$coolGray500" fontSize="$xs">Cargando…</Text>
          </HStack>
        )}
      </HStack>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {sections.length === 0 ? (
          <Box px="$5" mt="$4">
            <Text color="$coolGray500" fontSize="$sm">
              {token ? 'No hay movimientos en este rango.' : 'Inicia sesión para ver tus movimientos.'}
            </Text>
          </Box>
        ) : (
          sections.map((section, idx) => (
            <Box key={idx} px="$5" mt={idx === 0 ? "$5" : "$7"}>
              {/* Tarjeta del día */}
              <Box
                bg="$white"
                borderRadius="$2xl"
                borderWidth={1}
                borderColor="$coolGray200"
                overflow="hidden"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 3,
                }}
              >
                {section.items.map((r, i) => {
                  const subLabel = subcatsMap.get(String(r.subCategorias_id)) || 'Registro';
                  const accountLabel = cuentasMap.get(String(r.lista_cuentas_id)) || `Cuenta #${r.lista_cuentas_id}`;

                  return (
                    <React.Fragment key={r.id}>
                      <HStack
                        px="$5"
                        py="$4"
                        alignItems="center"
                        justifyContent="space-between"
                        bg="$white"
                      >
                        <HStack space="$4" alignItems="center" flex={1}>
                          <Box
                            w={46}
                            h={46}
                            borderRadius="$full"
                            bg="$coolGray100"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Icon as={MaterialCommunityIcons} name="file-document-outline" size={22} color="$black" />
                          </Box>

                          <VStack flex={1} space="$1">
                            <Text fontWeight="$bold" color="$black" numberOfLines={1} fontSize="$md">
                              {subLabel}
                            </Text>
                            <Badge action="muted" borderRadius="$lg" px="$2" py="$1" bg="$coolGray100" alignSelf="flex-start">
                              <BadgeText color="$coolGray600">{accountLabel}</BadgeText>
                            </Badge>
                          </VStack>

                          <HStack alignItems="center" space="$2">
                            <Text fontWeight="$bold" fontSize="$md" color={signColor(r.monto)}>
                              {signed(r.monto)}
                            </Text>

                            {/* Menú 3 puntos sin fondo */}
                            <Popover
                              isOpen={openMenuId === r.id}
                              onClose={() => setOpenMenuId(null)}
                              placement="bottom right"
                              trigger={(triggerProps) => (
                                <Pressable
                                  {...triggerProps}
                                  onPress={() => setOpenMenuId(r.id)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  accessibilityLabel="Abrir menú de registro"
                                >
                                  <Icon as={MaterialIcons} name="more-vert" size={22} color="$coolGray500" />
                                </Pressable>
                              )}
                            >
                              <PopoverBackdrop />
                              <PopoverContent w={220}>
                                <PopoverArrow />
                                <PopoverBody p={0}>
                                  <VStack divider={<Box h={1} bg="$coolGray100" />} space={0}>
                                    <Pressable px="$4" py="$3" onPress={() => startEdit(r)}>
                                      <HStack space="$2" alignItems="center">
                                        <Icon as={MaterialIcons} name="edit" size={18} color="$black" />
                                        <Text color="$black">Editar</Text>
                                      </HStack>
                                    </Pressable>
                                    <Pressable px="$4" py="$3" onPress={() => onDelete(r)}>
                                      <HStack space="$2" alignItems="center">
                                        <Icon as={MaterialIcons} name="delete-outline" size={18} color="$red600" />
                                        <Text color="$red600">Eliminar</Text>
                                      </HStack>
                                    </Pressable>
                                  </VStack>
                                </PopoverBody>
                              </PopoverContent>
                            </Popover>
                          </HStack>
                        </HStack>
                      </HStack>

                      {i < section.items.length - 1 && (
                        <Divider mx="$5" bg="$coolGray200" />
                      )}
                    </React.Fragment>
                  );
                })}
              </Box>

              {/* Footer de la sección: fecha abajo + total del día */}
              <HStack alignItems="center" justifyContent="space-between" mt="$2" px="$1">
                <Text color="$coolGray500" fontSize="$xs">{section.date}</Text>
                <Text fontWeight="$bold" fontSize="$sm" color={signColor(section.total)}>
                  {Number(section.total) < 0 ? `- ${fmtMoney2(section.total)}` : `+ ${fmtMoney2(section.total)}`}
                </Text>
              </HStack>
            </Box>
          ))
        )}

        {/* Filtros inferiores */}
        <BottomFilters active={activeFilter} onChange={setActiveFilter} />
      </ScrollView>

      {/* FAB */}
      <Box position="absolute" bottom={32} right={24}>
        <Button
          bg="$red600"
          borderRadius="$full"
          w={64}
          h={64}
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
    </>
  );

  // ===== Vista Formulario Edición (orden requerido) =====
  // Orden: Monto → Cuenta → Categoría → Subcategoría
  const renderForm = () => {
    const selectedCuenta = cuentasMap.get(String(form.lista_cuentas_id));
    const selectedCategoria = categoriasMap.get(String(form.categoria_id));
    const selectedSubcat = subcatsMap.get(String(form.subCategorias_id));

    return (
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
          <Pressable onPress={() => { if (!saving) { setShowForm(false); setEditingId(null); } }}>
            <HStack alignItems="center" space="$1.5">
              <Icon as={MaterialIcons} name="arrow-back-ios" size="md" color="$black" />
              <Text color="$black">Regresar</Text>
            </HStack>
          </Pressable>
          <Pressable disabled={!isValid || saving} onPress={handleSave} opacity={isValid && !saving ? 1 : 0.4}>
            <Icon as={MaterialIcons} name="check" size="xl" color="$black" />
          </Pressable>
        </HStack>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
          <Box bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$coolGray200" p="$4">
            <Text fontWeight="$bold" fontSize="$xl" color="$black" mb="$1">
              Editar registro
            </Text>
            <Text color="$coolGray500" fontSize="$sm" mb="$4">
              Actualiza los datos del movimiento. El cambio de monto no crea un registro nuevo.
            </Text>

            <VStack space="$5">
              {/* Monto */}
              <FormControl isRequired isInvalid={!!form.monto && !validAmount(form.monto)}>
                <FormControlLabel>
                  <FormControlLabelText fontWeight="$bold" color="$black">Monto</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputSlot pl="$3">
                    <InputIcon as={MaterialIcons} name="attach-money" />
                  </InputSlot>
                  <InputField
                    placeholder="Ej. -600.50 (gasto) o 5000 (ingreso)"
                    value={form.monto}
                    onChangeText={(v) => setForm(f => ({ ...f, monto: v }))}
                    keyboardType="numeric"
                  />
                </Input>
                {!!form.monto && !validAmount(form.monto) && (
                  <FormControlError mt="$1">
                    <FormControlErrorText>Formato inválido. Ej: 1500 o -1500.50</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>

              {/* Cuenta */}
              <FormControl isRequired isInvalid={!String(form.lista_cuentas_id).trim()}>
                <FormControlLabel>
                  <FormControlLabelText fontWeight="$bold" color="$black">Cuenta</FormControlLabelText>
                </FormControlLabel>
                <Select
                  selectedValue={form.lista_cuentas_id}
                  onValueChange={(v) => setForm(f => ({ ...f, lista_cuentas_id: v }))}
                >
                  <SelectTrigger borderColor="$coolGray300" bg="$white">
                    <SelectInput
                      placeholder="Selecciona la cuenta"
                      value={selectedCuenta || ''}
                    />
                    <SelectIcon as={MaterialIcons} name="expand-more" />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {cuentas.map(c => (
                        <SelectItem key={String(c.id)} label={c.nombre} value={String(c.id)} />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
                {/* Ayuda: muestra claramente el significado del ID seleccionado */}
                {String(form.lista_cuentas_id).trim() ? (
                  <Text mt="$1" color="$coolGray500" fontSize="$xs">
                    Seleccionado: {selectedCuenta || `ID ${form.lista_cuentas_id}`}
                  </Text>
                ) : null}
                {!String(form.lista_cuentas_id).trim() && (
                  <FormControlError mt="$1">
                    <FormControlErrorText>Selecciona una cuenta.</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>

              {/* Categoría */}
              <FormControl isRequired isInvalid={!String(form.categoria_id).trim()}>
                <FormControlLabel>
                  <FormControlLabelText fontWeight="$bold" color="$black">Categoría</FormControlLabelText>
                </FormControlLabel>
                <Select
                  selectedValue={form.categoria_id}
                  onValueChange={(v) => setForm(f => ({ ...f, categoria_id: v, subCategorias_id: '' }))}
                >
                <SelectTrigger borderColor="$coolGray300" bg="$white">
  <SelectInput
    placeholder="Selecciona una categoría"
    value={selectedCategoria || ''}
  />
  <SelectIcon as={MaterialIcons} name="expand-more" />
</SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {categorias.map(cat => (
                        <SelectItem key={String(cat.id)} label={cat.descripcion} value={String(cat.id)} />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
                {String(form.categoria_id).trim() ? (
                  <Text mt="$1" color="$coolGray500" fontSize="$xs">
                    Seleccionado: {selectedCategoria || `ID ${form.categoria_id}`}
                  </Text>
                ) : null}
                {!String(form.categoria_id).trim() && (
                  <FormControlError mt="$1">
                    <FormControlErrorText>Selecciona una categoría.</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>

              {/* Subcategoría (deshabilitado hasta elegir categoría) */}
              <FormControl isRequired isInvalid={!String(form.subCategorias_id).trim()}>
                <FormControlLabel>
                  <FormControlLabelText fontWeight="$bold" color="$black">Subcategoría</FormControlLabelText>
                </FormControlLabel>
                <Select
                  isDisabled={!String(form.categoria_id).trim()}
                  selectedValue={form.subCategorias_id}
                  onValueChange={(v) => setForm(f => ({ ...f, subCategorias_id: v }))}
                >
                  <SelectTrigger borderColor="$coolGray300" bg="$white">
  <SelectInput
    placeholder={String(form.categoria_id).trim() ? 'Selecciona una subcategoría' : 'Primero elige una categoría'}
    value={selectedSubcat || ''}
  />
  <SelectIcon as={MaterialIcons} name="expand-more" />
</SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {filteredSubcats.map(s => (
                        <SelectItem key={String(s.id)} label={s.descripcion} value={String(s.id)} />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
                {String(form.subCategorias_id).trim() ? (
                  <Text mt="$1" color="$coolGray500" fontSize="$xs">
                    Seleccionado: {selectedSubcat || `ID ${form.subCategorias_id}`}
                  </Text>
                ) : null}
                {!String(form.subCategorias_id).trim() && (
                  <FormControlError mt="$1">
                    <FormControlErrorText>Selecciona una subcategoría.</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>

              {/* Botón guardar */}
              <Button
                bg="$red600"
                borderRadius="$xl"
                h="$12"
                mt="$2"
                onPress={handleSave}
                isDisabled={!isValid || saving}
                opacity={isValid && !saving ? 1 : 0.6}
              >
                <ButtonText fontSize="$lg" fontWeight="$semibold" color="$white">
                  {saving ? 'Guardando…' : 'Guardar'}
                </ButtonText>
              </Button>
            </VStack>
          </Box>
        </ScrollView>

        {/* Overlay guardando */}
        {saving && (
          <Box position="absolute" top={0} left={0} right={0} bottom={0} zIndex={150} bg="rgba(255,255,255,0.5)" alignItems="center" justifyContent="center">
            <Spinner size="large" color="$red600" />
            <Text mt="$2" color="$red600">Guardando…</Text>
          </Box>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <Box flex={1} bg="$white">
        {/* Render condicional: lista o formulario */}
        {showForm ? renderForm() : renderList()}
      </Box>

      {/* Modal eliminar */}
      {confirmDelete && (
        <Box position="absolute" top={0} left={0} right={0} bottom={0} bg="rgba(0,0,0,0.35)" zIndex={200} alignItems="center" justifyContent="center">
          <Box w="90%" maxW={420} bg="$white" p="$5" borderRadius="$2xl" borderWidth={1} borderColor="$coolGray200">
            <VStack space="$3">
              <HStack alignItems="center" space="$2">
                <Icon as={MaterialIcons} name="warning-amber" size={22} color="$red600" />
                <Text fontWeight="$bold" fontSize="$md" color="$black">Eliminar registro</Text>
              </HStack>
              <Text color="$coolGray700" fontSize="$sm">Esta acción no se puede deshacer.</Text>
              <HStack mt="$2" space="$2" justifyContent="flex-end">
                <Button variant="outline" borderColor="$coolGray300" bg="$white" onPress={() => setConfirmDelete(null)}>
                  <ButtonText color="$black">Cancelar</ButtonText>
                </Button>
                <Button bg="$red600" onPress={doDelete}>
                  <ButtonText color="$white">Eliminar</ButtonText>
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}

      {/* Overlay de carga inicial */}
      {loading && !showForm && (
        <Box position="absolute" top={0} left={0} right={0} bottom={0} zIndex={150} bg="rgba(255,255,255,0.5)" alignItems="center" justifyContent="center">
          <Spinner size="large" color="$red600" />
          <Text mt="$2" color="$red600">Cargando…</Text>
        </Box>
      )}
    </SafeAreaView>
  );
}
