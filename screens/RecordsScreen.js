// screens/RecordsScreen.jsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, ScrollView, Pressable, ButtonText, Divider,
  Badge, BadgeText, Spinner, Popover, PopoverBackdrop, PopoverContent, PopoverArrow, PopoverBody
} from '@gluestack-ui/themed';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AppMenuPopover from '../components/AppMenuPopover';
import {
  getRegistros, getCuentas, getSubcategorias, getMetodos,
  deleteRegistro
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
    <Box borderTopWidth={1} borderColor="$coolGray200" bg="$white" px="$4" py="$3" mt="$2" mb="$4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
        <HStack space="$2" alignItems="center">
          {FILTERS.map((label) => {
            const selected = active === label;
            return (
              <Button
                key={label}
                onPress={() => onChange(label)}
                bg={selected ? '$black' : '$white'}
                variant={selected ? 'solid' : 'outline'}
                borderColor="$coolGray300"
                borderRadius="$lg"
                minW={110}
                h={44}
                px="$4"
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
  const [subcats, setSubcats] = useState([]);
  const [metodos, setMetodos] = useState([]);

  // Registros
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [activeFilter, setActiveFilter] = useState(FILTERS[1]); // 30 días por defecto
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const abortRef = useRef(null);

  // Load data
  useEffect(() => {
    // Si no hay token, no bloquees la pantalla
    if (!token) {
      setLoading(false);
      setErrorMsg('No hay sesión activa. Inicia sesión para ver tus registros.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // AbortController (por si desmonta la pantalla antes de terminar)
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const [rC, rS, rM, rR] = await Promise.allSettled([
          getCuentas(token),
          getSubcategorias(token),
          getMetodos(token),        // /categoria_metodos/
          getRegistros(token),
        ]);

        if (controller.signal.aborted) return;

        setCuentas(rC.status === 'fulfilled' ? rC.value : []);
        setSubcats(rS.status === 'fulfilled' ? rS.value : []);
        setMetodos(rM.status === 'fulfilled' ? rM.value : []);
        setRegistros(rR.status === 'fulfilled' ? (Array.isArray(rR.value) ? rR.value : []) : []);

        // Mensaje si algo falló (sin bloquear)
        if (rC.status === 'rejected' || rS.status === 'rejected' || rM.status === 'rejected' || rR.status === 'rejected') {
          setErrorMsg('Algunos datos no se pudieron cargar. Intenta recargar.');
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setErrorMsg('Error al conectar con el servidor.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [token]);

  // Mapas
  const cuentasMap = useMemo(() => {
    const m = new Map();
    cuentas.forEach(c => m.set(c.id, c.nombre));
    return m;
  }, [cuentas]);

  const metodosMap = useMemo(() => {
    const m = new Map();
    metodos.forEach(c => m.set(c.id, c.nombre));
    return m;
  }, [metodos]);

  const subcatsMap = useMemo(() => {
    const m = new Map();
    subcats.forEach(s => m.set(s.id, s.descripcion));
    return m;
  }, [subcats]);

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
    } catch (e) {
      setErrorMsg('No se pudieron refrescar los registros.');
    }
  };

  const onEdit = (r) => {
    // Aquí podrías abrir tu modal/form de edición
    setOpenMenuId(null);
    alert(`Editar registro #${r.id} (implementa tu modal/form aquí)`);
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
    } catch (e) {
      alert('No se pudo eliminar el registro');
    }
  };

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
          <Pressable rounded="$full" p="$2" bg="$coolGray100" onPress={onNotifications}>
            <Icon as={MaterialIcons} name="notifications-none" size={24} color="$black" />
          </Pressable>
        </HStack>

        {/* Filtros superiores de rango (texto) */}
        <HStack px="$4" pt="$3" pb="$1" alignItems="center" justifyContent="space-between">
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

        <ScrollView contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
          {sections.length === 0 ? (
            <Box px="$4" mt="$3">
              <Text color="$coolGray500" fontSize="$sm">
                {token ? 'No hay movimientos en este rango.' : 'Inicia sesión para ver tus movimientos.'}
              </Text>
            </Box>
          ) : (
            sections.map((section, idx) => (
              <Box key={idx} px="$4" mt={idx === 0 ? "$3" : "$2"}>
                {/* Encabezado del día */}
                <HStack alignItems="center" justifyContent="space-between" mb="$1">
                  <HStack alignItems="center" space="$2">
                    <Text fontWeight="$bold" fontSize={18} color="$black">{section.date}</Text>
                  </HStack>
                  <Text fontWeight="$bold" fontSize={18} color={signColor(section.total)}>
                    {Number(section.total) < 0 ? `- ${fmtMoney2(section.total)}` : `+ ${fmtMoney2(section.total)}`}
                  </Text>
                </HStack>

                {/* Tarjeta del día */}
                <Box
                  bg="$white"
                  borderRadius="$xl"
                  borderWidth={1}
                  borderColor="$coolGray200"
                  overflow="hidden"
                  style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 2,
                  }}
                >
                  {section.items.map((r, i) => {
                    const title =
                      metodosMap.get(r.categori_metodos_id) ||
                      subcatsMap.get(r.subCategorias_id) ||
                      'Registro';
                    const accountName = cuentasMap.get(r.lista_cuentas_id) || `Cuenta #${r.lista_cuentas_id}`;
                    return (
                      <React.Fragment key={r.id}>
                        <HStack
                          px="$4"
                          py="$3"
                          alignItems="center"
                          justifyContent="space-between"
                          bg="$white"
                        >
                          <HStack space="$3" alignItems="center" flex={1}>
                            {/* Icono relacionado a “registro” */}
                            <Box
                              w={40}
                              h={40}
                              borderRadius="$full"
                              bg="$coolGray100"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Icon as={MaterialCommunityIcons} name="file-document-outline" size={20} color="$black" />
                            </Box>

                            <VStack flex={1}>
                              <HStack alignItems="center" space="$2">
                                <Text fontWeight="$bold" color="$black" numberOfLines={1}>{title}</Text>
                                <Badge action="muted" borderRadius="$md" px="$2" py="$1" bg="$coolGray100">
                                  <BadgeText color="$coolGray600">{accountName}</BadgeText>
                                </Badge>
                              </HStack>
                            </VStack>

                            <HStack alignItems="center" space="$2">
                              <Text fontWeight="$bold" color={signColor(r.monto)}>{signed(r.monto)}</Text>

                              {/* Menú 3 puntitos */}
                              <Popover
                                isOpen={openMenuId === r.id}
                                onClose={() => setOpenMenuId(null)}
                                placement="bottom right"
                                trigger={(triggerProps) => (
                                  <Pressable
                                    {...triggerProps}
                                    onPress={() => setOpenMenuId(r.id)}
                                    p="$2" rounded="$full" bg="$coolGray100"
                                    accessibilityLabel="Abrir menú de registro"
                                  >
                                    <Icon as={MaterialIcons} name="more-vert" size={20} color="$black" />
                                  </Pressable>
                                )}
                              >
                                <PopoverBackdrop />
                                <PopoverContent w={200}>
                                  <PopoverArrow />
                                  <PopoverBody p={0}>
                                    <VStack divider={<Box h={1} bg="$coolGray100" />} space={0}>
                                      <Pressable px="$4" py="$3" onPress={() => onEdit(r)}>
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
                        {i < section.items.length - 1 && <Divider mx="$4" bg="$coolGray200" />}
                      </React.Fragment>
                    );
                  })}
                </Box>
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
            w={60}
            h={60}
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

        {/* Modal eliminar */}
        {confirmDelete && (
          <Box position="absolute" top={0} left={0} right={0} bottom={0} bg="rgba(0,0,0,0.35)" zIndex={200} alignItems="center" justifyContent="center">
            <Box w="90%" maxW={420} bg="$white" p="$4" borderRadius="$2xl" borderWidth={1} borderColor="$coolGray200">
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

        {/* Overlay de carga (solo cuando realmente está cargando) */}
        {loading && (
          <Box position="absolute" top={0} left={0} right={0} bottom={0} zIndex={150} bg="rgba(255,255,255,0.5)" alignItems="center" justifyContent="center">
            <Spinner size="large" color="$red600" />
            <Text mt="$2" color="$red600">Cargando…</Text>
          </Box>
        )}
      </Box>
    </SafeAreaView>
  );
}
