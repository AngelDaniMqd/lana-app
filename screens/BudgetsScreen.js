import React, { useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, Icon, ScrollView, Pressable, Divider, ButtonText,
  Input, InputField, InputSlot, InputIcon,
  FormControl, FormControlLabel, FormControlLabelText, FormControlHelper, FormControlHelperText,
  FormControlError, FormControlErrorText,
  Popover, PopoverBackdrop, PopoverContent, PopoverArrow, PopoverBody,
  AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import AppMenuPopover from '../components/AppMenuPopover';

export default function BudgetsScreen({
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
}) {
  const [showPopover, setShowPopover] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [budgets, setBudgets] = useState([
    { id: 'b1', category: 'Alimentos', amount: 2000, spent: 1500 },
    { id: 'b2', category: 'Transporte', amount: 800, spent: 900 },
  ]);

  const [form, setForm] = useState({ id: '', category: '', amount: '' });
  const [editingId, setEditingId] = useState(null);

  // Confirmación de eliminación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const cancelRef = useRef(null);

  const validMoney = (v) => /^(\d+)([.,]\d{1,2})?$/.test(String(v).replace(',', '.'));

  const errors = useMemo(() => {
    const e = {};
    if (!form.category.trim()) e.category = 'Escribe una categoría.';
    if (!form.amount || !validMoney(form.amount)) e.amount = 'Monto inválido (ej. 1500 o 1500.50).';
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
      />
      <Text fontSize="$2xl" fontWeight="$bold" color="$black">{title}</Text>
      <Pressable rounded="$full" p="$2" bg="$coolGray100" onPress={onNotifications}>
        <Icon as={MaterialIcons} name="notifications-none" size={24} color="$black" />
      </Pressable>
    </HStack>
  );

  const openCreate = () => {
    setForm({ id: '', category: '', amount: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({ id: item.id, category: item.category, amount: String(item.amount) });
    setEditingId(item.id);
    setShowForm(true);
  };

  const askDelete = (item) => {
    setToDelete(item);
    setConfirmOpen(true);
  };

  const doDelete = () => {
    setBudgets((prev) => prev.filter((b) => b.id !== toDelete.id));
    setConfirmOpen(false);
    setToDelete(null);
  };

  const saveBudget = () => {
    if (!isValid) return;

    if (editingId) {
      setBudgets((prev) =>
        prev.map((b) =>
          b.id === editingId
            ? {
                ...b,
                category: form.category.trim(),
                amount: Number(String(form.amount).replace(',', '.')),
              }
            : b
        )
      );
    } else {
      const newBudget = {
        id: String(Date.now()),
        category: form.category.trim(),
        amount: Number(String(form.amount).replace(',', '.')),
        spent: 0,
      };
      setBudgets((prev) => [...prev, newBudget]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm({ id: '', category: '', amount: '' });
  };

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
              <ItemRow icon="edit" label="Editar presupuesto" onPress={() => openEdit(item)} />
              <ItemRow icon="delete-outline" label="Eliminar" danger onPress={() => askDelete(item)} />
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  };

  const renderList = () => (
    <>
      <Header title="Presupuestos" />
      <Divider bg="$coolGray200" />

      <ScrollView px="$6" py="$4" contentContainerStyle={{ paddingBottom: 96 }}>
        {budgets.map((b) => {
          const exceeded = b.spent > b.amount;
          const pct = Math.max(0, Math.min(100, Math.round((b.spent / (b.amount || 1)) * 100)));
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
                    {b.category}
                  </Text>
                  <Text color="$coolGray600" fontSize="$xs" flexShrink={1}>
                    Asignado mensual
                  </Text>
                </VStack>

                {/* Derecha */}
                <HStack space="$3" alignItems="flex-start" maxW={200}>
                  <VStack alignItems="flex-end" flexShrink={1}>
                    <Text color={exceeded ? '$red600' : '$black'} numberOfLines={1} ellipsizeMode="tail">
                      MXN {b.spent.toLocaleString('es-MX')} / {b.amount.toLocaleString('es-MX')}
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
            <Text>¿Eliminar el presupuesto <Text fontWeight="$bold">{toDelete?.category}</Text>? Esta acción no se puede deshacer.</Text>
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

// --- dentro de BudgetsScreen ---
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
      <Pressable disabled={!isValid} onPress={saveBudget} opacity={isValid ? 1 : 0.4}>
        <Icon as={MaterialIcons} name="check" size="xl" color="$black" />
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
          <FormControl isInvalid={!!errors.category}>
            <FormControlLabel>
              <FormControlLabelText fontWeight="$bold" color="$black">Categoría</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="category" /></InputSlot>
              <InputField
                placeholder="Ej. Alimentos, Transporte, etc."
                value={form.category}
                onChangeText={(v) => setForm((f) => ({ ...f, category: v }))}
              />
            </Input>
            {!errors.category ? (
              <FormControlHelper>
                <FormControlHelperText>Usa un nombre claro para identificarlo rápido.</FormControlHelperText>
              </FormControlHelper>
            ) : (
              <FormControlError mt="$1">
                <FormControlErrorText>{errors.category}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* Monto mensual */}
          <FormControl isInvalid={!!errors.amount}>
            <FormControlLabel>
              <FormControlLabelText fontWeight="$bold" color="$black">Monto mensual</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="attach-money" /></InputSlot>
              <InputField
                placeholder="MXN 0.00"
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

          {/* Botón (más el check del header) */}
          <Button
            bg="$red600"
            borderRadius="$xl"
            h="$12"
            mt="$2"
            onPress={saveBudget}
            isDisabled={!isValid}
            opacity={isValid ? 1 : 0.6}
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
