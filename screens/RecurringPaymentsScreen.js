// RecurringPaymentsScreen.js
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, ScrollView, Pressable, Divider, ButtonText, Switch,
  Input, InputField, InputSlot, InputIcon,
  FormControl, FormControlLabel, FormControlLabelText, FormControlHelper, FormControlHelperText,
  FormControlError, FormControlErrorText,
  Popover, PopoverBackdrop, PopoverContent, PopoverArrow, PopoverBody,
  AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
  Spinner
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import AppMenuPopover from '../components/AppMenuPopover';
import {
  getPagosFijos,
  postPagoFijo,
  putPagoFijo,
  deletePagoFijo,
} from '../api';

// ===== Helpers =====
function computeNextDate(day) {
  const n = Math.min(Math.max(1, parseInt(String(day), 10) || 1), 31);
  const now = new Date();
  let next = new Date(now.getFullYear(), now.getMonth(), n);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (next < today) next = new Date(now.getFullYear(), now.getMonth() + 1, n);
  const dd = String(next.getDate()).padStart(2, '0');
  const mm = String(next.getMonth() + 1).padStart(2, '0');
  const yyyy = next.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const NAME_MIN = 3;
const NAME_MAX = 40;
const MONEY_MIN = 1.0;
const MONEY_MAX = 1_000_000.0;

const moneyRegex = /^\d+([.,]\d{1,2})?$/;
const validDay = (d) => /^\d{1,2}$/.test(String(d)) && Number(d) >= 1 && Number(d) <= 31;
const parseMoney = (v) => Number(String(v).replace(',', '.'));
const validMoneyStrict = (v) => {
  const s = String(v).replace(',', '.').trim();
  if (!moneyRegex.test(s)) return false;
  const n = Number(s);
  return !isNaN(n) && n >= MONEY_MIN && n <= MONEY_MAX;
};

export default function RecurringPaymentsScreen({
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
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({ id: null, name: '', amount: '', day: '' });
  const [editingId, setEditingId] = useState(null);

  // Confirmación/eliminación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const cancelRef = useRef(null);

  // Errores/alertas
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ===== Fetch =====
  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getPagosFijos(token);
      const uiList = (Array.isArray(list) ? list : []).map((p) => ({
        id: p.id,
        name: p.nombre,
        amount: Number(p.monto || 0),
        active: Number(p.activo || 1) === 1,
        day: Number(p.dia_pago || 1),
        next: computeNextDate(p.dia_pago || 1),
      }));
      setPayments(uiList);
    } catch {
      setPayments([]);
      setErrorMsg('No se pudieron cargar los pagos fijos.');
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  // ===== Validación =====
  const errors = useMemo(() => {
    const e = {};
    const nameTrim = form.name.trim();

    if (!nameTrim || nameTrim.length < NAME_MIN || nameTrim.length > NAME_MAX) {
      e.name = `El nombre debe tener entre ${NAME_MIN} y ${NAME_MAX} caracteres.`;
    }

    if (!form.amount || !validMoneyStrict(form.amount)) {
      e.amount =
        `Monto inválido (ej. 229 o 229.00). Mín: ${MONEY_MIN.toFixed(2)}, Máx: ${MONEY_MAX.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`;
    }

    if (!form.day || !validDay(form.day)) e.day = 'Día válido: 1–31.';
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  // ===== Actions =====
  const openCreate = () => {
    setForm({ id: null, name: '', amount: '', day: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({
      id: item.id,
      name: item.name,
      amount: String(item.amount),
      day: String(item.day || ''),
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
      await deletePagoFijo(toDelete.id, token);
      setConfirmOpen(false);
      setToDelete(null);
      await loadData();
    } catch {
      setErrorMsg('No se pudo eliminar el pago fijo.');
      setErrorOpen(true);
    }
  };

  const toggleActive = async (idx, value) => {
    const item = payments[idx];
    // Optimista
    setPayments((prev) => prev.map((p, i) => (i === idx ? { ...p, active: value } : p)));
    try {
      await putPagoFijo(item.id, { activo: value ? 1 : 0 }, token);
    } catch {
      // Revertir si falla
      setPayments((prev) => prev.map((p, i) => (i === idx ? { ...p, active: !value } : p)));
      setErrorMsg('No se pudo cambiar el estado del pago.');
      setErrorOpen(true);
    }
  };

  const addOrUpdatePayment = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const payload = {
        nombre: form.name.trim(),
        monto: parseMoney(form.amount),
        dia_pago: Number(form.day),
      };

      if (editingId) {
        await putPagoFijo(editingId, payload, token);
      } else {
        await postPagoFijo(payload, token);
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ id: null, name: '', amount: '', day: '' });
      await loadData();
    } catch (e) {
      let msg = 'No se pudo guardar el pago fijo.';
      if (e && typeof e.message === 'string' && e.message.length < 400) msg = e.message;
      setErrorMsg(msg);
      setErrorOpen(true);
    } finally {
      setSaving(false);
    }
  };

  // ===== Render =====
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
    const Row = ({ icon, label, onPress, danger }) => (
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
        trigger={(t = {}) => (
          <Pressable
            {...t}
            onPress={() => setOpen(true)}
            rounded="$md"
            bg="$transparent"
            borderWidth={1}
            borderColor="$transparent"
            px="$1"
            py="$1"
            alignSelf="flex-start"
          >
            <HStack space="$1" alignItems="center">
              <Icon as={MaterialIcons} name="more-vert" size={20} color="$black" />
              <Text color="$black"></Text>
            </HStack>
          </Pressable>
        )}
      >
        <PopoverBackdrop />
        <PopoverContent w={220} maxW={250} p="$0">
          <PopoverArrow />
          <PopoverBody p="$0">
            <VStack divider={<Box h={1} bg="$coolGray100" />}>
              <Row icon="edit" label="Editar" onPress={() => openEdit(item)} />
              <Row icon="delete-outline" label="Eliminar" danger onPress={() => askDelete(item)} />
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  };

  const renderList = () => (
    <>
      <Header title="Pagos fijos" />
      <Divider bg="$coolGray200" />

      <ScrollView px="$6" py="$4" contentContainerStyle={{ paddingBottom: 96 }}>
        {loading ? (
          <HStack space="$2" alignItems="center">
            <Spinner />
            <Text color="$coolGray500">Cargando…</Text>
          </HStack>
        ) : payments.length === 0 ? (
          <Text color="$coolGray500">No tienes pagos fijos registrados.</Text>
        ) : (
          payments.map((p, i) => (
            <Box
              key={p.id}
              mb="$4"
              p="$4"
              borderRadius="$xl"
              borderWidth={1}
              borderColor="$coolGray200"
              bg={p.active ? '$white' : '$coolGray100'}
              overflow="hidden"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
              }}
            >
              <HStack justifyContent="space-between" alignItems="flex-start" space="$3">
                {/* Izquierda */}
                <VStack flex={1} minW={0}>
                  <Text fontWeight="$bold" color="$black" numberOfLines={1} ellipsizeMode="tail">
                    {p.name}
                  </Text>
                  <Text color="$coolGray500" fontSize="$xs" flexShrink={1}>
                    Próximo: {p.next}
                  </Text>
                </VStack>

                {/* Derecha */}
                <VStack alignItems="flex-end" space="$1" maxW={160}>
                  <Text color="$black" numberOfLines={1} ellipsizeMode="tail">
                    MXN {Number(p.amount || 0).toLocaleString('es-MX')}
                  </Text>
                  <HStack alignItems="center" space="$2" flexWrap="nowrap">
                    <Text color="$coolGray600" fontSize="$xs" numberOfLines={1}>
                      {p.active ? 'Activo' : 'Pausado'}
                    </Text>
                    <Switch value={p.active} onValueChange={(v) => toggleActive(i, v)} />
                    <CardActions item={p} />
                  </HStack>
                </VStack>
              </HStack>
            </Box>
          ))
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
            <Text>¿Seguro que quieres eliminar <Text fontWeight="$bold">{toDelete?.name}</Text>? Esta acción no se puede deshacer.</Text>
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

      {/* Modal de error */}
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
        
      </HStack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <VStack space="$2" mb="$2">
          <Text fontWeight="$bold" fontSize={20} color="$black">
            {editingId ? 'Editar pago fijo' : 'Nuevo pago fijo'}
          </Text>
          <Text color="$coolGray600" fontSize={12}>
            Completa los datos para {editingId ? 'actualizar' : 'registrar'} tu pago fijo.
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
            {/* Nombre (3–40) */}
            <FormControl isInvalid={!!errors.name}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Nombre</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="description" /></InputSlot>
                <InputField
                  placeholder="Ej. Netflix, Renta"
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  maxLength={NAME_MAX}
                />
              </Input>
              {!errors.name ? (
                <FormControlHelper>
                  <FormControlHelperText>Mínimo {NAME_MIN} y máximo {NAME_MAX} caracteres.</FormControlHelperText>
                </FormControlHelper>
              ) : (
                <FormControlError mt="$1">
                  <FormControlErrorText>{errors.name}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Monto (1.00 – 1,000,000.00) */}
            <FormControl isInvalid={!!errors.amount}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Monto</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="attach-money" /></InputSlot>
                <InputField
                  placeholder="0.00"
                  value={form.amount}
                  onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
                  keyboardType="numeric"
                  maxLength={12} 
                />
              </Input>
              {!errors.amount ? (
                <FormControlHelper>
                  <FormControlHelperText>Formato 123 o 123.45. Mínimo {MONEY_MIN.toFixed(2)} · Máximo {MONEY_MAX.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</FormControlHelperText>
                </FormControlHelper>
              ) : (
                <FormControlError mt="$1">
                  <FormControlErrorText>{errors.amount}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Día de cobro (1–31) */}
            <FormControl isInvalid={!!errors.day}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Día de cobro</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="event" /></InputSlot>
                <InputField
                  placeholder="1-31"
                  value={form.day}
                  onChangeText={(v) => setForm((f) => ({ ...f, day: v }))}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </Input>
              {!errors.day ? (
                <FormControlHelper>
                  <FormControlHelperText>El día del mes en que se te cobra (1–31).</FormControlHelperText>
                </FormControlHelper>
              ) : (
                <FormControlError mt="$1">
                  <FormControlErrorText>{errors.day}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <Button
              bg="$red600"
              borderRadius="$xl"
              h="$12"
              mt="$2"
              onPress={addOrUpdatePayment}
              isDisabled={!isValid || saving}
              opacity={isValid && !saving ? 1 : 0.6}
            >
              <ButtonText fontSize="$lg" fontWeight="$semibold" color="$white">
                {editingId ? 'Guardar cambios' : 'Guardar pago'}
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

        {/* Overlay guardando */}
        {saving && (
          <Box
            position="absolute"
            left={0}
            right={0}
            top={0}
            bottom={0}
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
