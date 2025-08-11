import React, { useMemo, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, ScrollView, Pressable, Divider, ButtonText, Switch,
  Input, InputField, InputSlot, InputIcon,
  FormControl, FormControlLabel, FormControlLabelText, FormControlHelper, FormControlHelperText,
  FormControlError, FormControlErrorText,
  Popover, PopoverBackdrop, PopoverContent, PopoverArrow, PopoverBody,
  AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import AppMenuPopover from '../components/AppMenuPopover';

export default function RecurringPaymentsScreen({
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

  const [payments, setPayments] = useState([
    { id: 'p1', name: 'Netflix', amount: 229, active: true, next: '15/08/2025', category: 'Entretenimiento' },
    { id: 'p2', name: 'Renta', amount: 5000, active: true, next: '01/09/2025', category: 'Vivienda' },
  ]);

  const [form, setForm] = useState({ id: '', name: '', amount: '', category: '', day: '' });
  const [editingId, setEditingId] = useState(null);

  // Modal de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const cancelRef = useRef(null);

  const validMoney = (v) => /^(\d+)([.,]\d{1,2})?$/.test(String(v).replace(',', '.'));
  const validDay = (d) => /^\d{1,2}$/.test(String(d)) && Number(d) >= 1 && Number(d) <= 31;

  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = 'Escribe un nombre.';
    if (!form.amount || !validMoney(form.amount)) e.amount = 'Monto inválido (ej. 229 o 229.00).';
    if (!form.day || !validDay(form.day)) e.day = 'Día 1–31.';
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

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

  const openCreate = () => {
    setForm({ id: '', name: '', amount: '', category: '', day: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    const assumedDay = item.next?.slice(0, 2) || '';
    setForm({
      id: item.id,
      name: item.name,
      amount: String(item.amount),
      category: item.category || '',
      day: assumedDay,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const addOrUpdatePayment = () => {
    if (!isValid) return;
    const day = String(form.day).padStart(2, '0');
    // Lógica demo para "next" (ajústala a tu cálculo real)
    const next = `${day}/09/2025`;

    if (editingId) {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: form.name.trim(),
                amount: Number(String(form.amount).replace(',', '.')),
                category: form.category.trim() || 'Otros',
                next,
              }
            : p
        )
      );
    } else {
      setPayments((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          name: form.name.trim(),
          amount: Number(String(form.amount).replace(',', '.')),
          active: true,
          next,
          category: form.category.trim() || 'Otros',
        },
      ]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ id: '', name: '', amount: '', category: '', day: '' });
  };

  const askDelete = (item) => {
    setToDelete(item);
    setConfirmOpen(true);
  };

  const doDelete = () => {
    setPayments((prev) => prev.filter((p) => p.id !== toDelete.id));
    setConfirmOpen(false);
    setToDelete(null);
  };

  const toggleActive = (idx, v) =>
    setPayments((prev) => prev.map((p, i) => (i === idx ? { ...p, active: v } : p)));

  const CardActions = ({ item, index }) => {
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
        {payments.map((p, i) => (
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
              {/* Izquierda: wrap y truncado */}
              <VStack flex={1} minW={0}>
                <Text fontWeight="$bold" color="$black" numberOfLines={1} ellipsizeMode="tail">
                  {p.name}
                </Text>
                <Text color="$coolGray500" fontSize="$xs" flexShrink={1}>
                  {p.category} · Próximo: {p.next}
                </Text>
              </VStack>

              {/* Derecha: ancho acotado */}
              <VStack alignItems="flex-end" space="$1" maxW={160}>
                <Text color="$black" numberOfLines={1} ellipsizeMode="tail">
                  MXN {p.amount.toLocaleString('es-MX')}
                </Text>
                <HStack alignItems="center" space="$2" flexWrap="nowrap">
                  <Text color="$coolGray600" fontSize="$xs" numberOfLines={1}>
                    {p.active ? 'Activo' : 'Pausado'}
                  </Text>
                  <Switch value={p.active} onValueChange={(v) => toggleActive(i, v)} />
                  <CardActions item={p} index={i} />
                </HStack>
              </VStack>
            </HStack>
          </Box>
        ))}
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
    </>
  );
// --- dentro de RecurringPaymentsScreen ---
const renderForm = () => (
  <Box flex={1} bg="$white">
    {/* Header del formulario (estilo cuenta) */}
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
      <Pressable disabled={!isValid} onPress={addOrUpdatePayment} opacity={isValid ? 1 : 0.4}>
        <Icon as={MaterialIcons} name="check" size="xl" color="$black" />
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
          {/* Nombre */}
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
              />
            </Input>
            {!errors.name ? (
              <FormControlHelper>
                <FormControlHelperText>Identifícalo fácilmente en la lista.</FormControlHelperText>
              </FormControlHelper>
            ) : (
              <FormControlError mt="$1">
                <FormControlErrorText>{errors.name}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* Monto */}
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
              />
            </Input>
            {!errors.amount ? (
              <FormControlHelper>
                <FormControlHelperText>Solo números, hasta 2 decimales.</FormControlHelperText>
              </FormControlHelper>
            ) : (
              <FormControlError mt="$1">
                <FormControlErrorText>{errors.amount}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* Categoría (opcional) */}
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText fontWeight="$bold" color="$black">Categoría (opcional)</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="category" /></InputSlot>
              <InputField
                placeholder="Ej. Entretenimiento"
                value={form.category}
                onChangeText={(v) => setForm((f) => ({ ...f, category: v }))}
              />
            </Input>
            <FormControlHelper>
              <FormControlHelperText>Úsalo para agrupar tus pagos.</FormControlHelperText>
            </FormControlHelper>
          </FormControl>

          {/* Día de cobro */}
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
              />
            </Input>
            {!errors.day ? (
              <FormControlHelper>
                <FormControlHelperText>El día del mes en que se te cobra.</FormControlHelperText>
              </FormControlHelper>
            ) : (
              <FormControlError mt="$1">
                <FormControlErrorText>{errors.day}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* Botón (redundante con el check, pero lo dejamos) */}
          <Button
            bg="$red600"
            borderRadius="$xl"
            h="$12"
            mt="$2"
            onPress={addOrUpdatePayment}
            isDisabled={!isValid}
            opacity={isValid ? 1 : 0.6}
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
      </Box>
    </SafeAreaView>
  );
}
