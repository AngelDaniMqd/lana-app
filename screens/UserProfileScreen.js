import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Button, ButtonText, Icon, Pressable, Divider,
  Input, InputField, InputSlot, InputIcon,
  FormControl, FormControlLabel, FormControlLabelText,
  FormControlError, FormControlErrorText
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import AppMenuPopover from '../components/AppMenuPopover';
import { deleteUser } from '../api';

export default function UserProfileScreen({
  user = {},
  token,
  onMenu = () => {},
  onStatistics = () => {},
  onDebts = () => {},
  onGoals = () => {},
  onHome = () => {},
  onBudgets = () => {},
  onRecurring = () => {},
  onLogout = () => {},
  onNotifications = () => {},
  onEdit = async () => false, // <- debe devolver boolean
  onDelete = () => {},
  onProfile = () => {},
}) {
  const [showPopover, setShowPopover] = useState(false);

  // vista de edición
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    apellidos: user?.apellidos || '',
    correo: user?.correo || '',
    telefono: user?.telefono ? String(user.telefono) : '',
  });
  const [errors, setErrors] = useState({});

  // confirmaciones
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);

  useEffect(() => {
    setForm({
      nombre: user?.nombre || '',
      apellidos: user?.apellidos || '',
      correo: user?.correo || '',
      telefono: user?.telefono ? String(user.telefono) : '',
    });
  }, [user]);

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.apellidos.trim()) e.apellidos = 'Los apellidos son requeridos';
    if (!form.correo.trim()) e.correo = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(form.correo)) e.correo = 'El correo no es válido';
    if (!form.telefono.trim()) e.telefono = 'El teléfono es requerido';
    else if (!/^\+?[\d\s-]{10,}$/.test(form.telefono)) e.telefono = 'El teléfono no es válido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Al presionar guardar, primero pide confirmación
  const saveProfile = () => {
    if (!validate()) return;
    setShowConfirmEdit(true);
  };

  // Si confirma, manda el PUT (onEdit debe devolver true/false)
  const confirmEdit = async () => {
    setShowConfirmEdit(false);
    console.log('Perfil: datos enviados a la API (PUT):', form);
    const ok = await onEdit({ ...form });
    if (ok) {
      setEditing(false); // vuelve a la vista de perfil
    } else {
      // si onEdit devolvió false, mantenemos el form abierto
    }
  };

  const openEdit = () => {
    setForm({
      nombre: user?.nombre || '',
      apellidos: user?.apellidos || '',
      correo: user?.correo || '',
      telefono: user?.telefono ? String(user.telefono) : '',
    });
    setErrors({});
    setEditing(true);
  };

  // DELETE usando el contrato nuevo de api.deleteUser => { ok, status, text }
  const confirmDelete = async () => {
    setShowConfirmDelete(false);

    console.log('Perfil: id a eliminar:', user?.id);
    console.log('Perfil: token presente?', !!token);

    if (!user?.id || !token) {
      alert('Falta token o ID de usuario. No se puede eliminar.');
      return;
    }

    try {
      const res = await deleteUser(user.id, token); // { ok, status, text }
      console.log('DELETE status:', res.status, res.text);

      if (res.ok) {
        onLogout(); // limpia sesión y te manda al login
      } else {
        alert('Error al eliminar usuario: ' + (res.text || `HTTP ${res.status}`));
      }
    } catch (e) {
      alert('Error de red al eliminar usuario');
    }
  };

  const Header = ({ title }) => (
    <HStack px="$6" py="$4" alignItems="center" justifyContent="space-between">
      <AppMenuPopover
        user={user}
        showPopover={showPopover}
        setShowPopover={setShowPopover}
        onMenu={onMenu}
        onStatistics={onStatistics}
        onDebts={onDebts}
        onGoals={onGoals}
        onHome={onHome}
        onBudgets={onBudgets}
        onRecurring={onRecurring}
        onLogout={onLogout}
        onProfile={onProfile}
      />
      <Text fontSize="$2xl" fontWeight="$bold" color="$black">{title}</Text>
      <Pressable rounded="$full" p="$2" bg="$coolGray100" onPress={onNotifications}>
        <Icon as={MaterialIcons} name="notifications-none" size={24} color="$black" />
      </Pressable>
    </HStack>
  );

  const renderProfile = () => (
    <>
      <Header title="Mi Perfil" />
      <VStack px="$6" py="$6" space="$5">
        {/* Card resumen */}
        <Box
          bg="$white"
          borderRadius="$xl"
          p="$5"
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
          <HStack alignItems="center" space="$4">
            <Box
              w={64}
              h={64}
              borderRadius="$full"
              bg="$coolGray100"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={MaterialIcons} name="person" size={32} color="$coolGray600" />
            </Box>
            <VStack flex={1}>
              <Text fontSize="$lg" fontWeight="$bold" color="$black" numberOfLines={1}>
                {(user?.nombre || '—') + ' ' + (user?.apellidos || '')}
              </Text>
              <Text color="$coolGray600" numberOfLines={1}>{user?.correo || '—'}</Text>
              <Text color="$coolGray600" numberOfLines={1}>{user?.telefono || '—'}</Text>
            </VStack>
          </HStack>
        </Box>

        {/* Card detalles */}
        <Box
          bg="$white"
          borderRadius="$xl"
          p="$5"
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
          <Text fontWeight="$bold" color="$black" mb="$3">Información de la cuenta</Text>
          <VStack space="$3">
            <VStack>
              <Text color="$coolGray500" fontSize="$xs">Nombre</Text>
              <Text color="$black">{user?.nombre || '—'}</Text>
            </VStack>
            <Divider bg="$coolGray100" />
            <VStack>
              <Text color="$coolGray500" fontSize="$xs">Apellidos</Text>
              <Text color="$black">{user?.apellidos || '—'}</Text>
            </VStack>
            <Divider bg="$coolGray100" />
            <VStack>
              <Text color="$coolGray500" fontSize="$xs">Correo</Text>
              <Text color="$black">{user?.correo || '—'}</Text>
            </VStack>
            <Divider bg="$coolGray100" />
            <VStack>
              <Text color="$coolGray500" fontSize="$xs">Teléfono</Text>
              <Text color="$black">{user?.telefono || '—'}</Text>
            </VStack>
          </VStack>

          <HStack space="$3" mt="$5">
            <Button
              variant="outline"
              borderColor="$red600"
              borderRadius="$full"
              onPress={() => setShowConfirmDelete(true)}
              flex={1}
            >
              <ButtonText color="$red600">Eliminar</ButtonText>
            </Button>
            <Button
              bg="$red600"
              borderRadius="$full"
              onPress={openEdit}
              flex={1}
            >
              <ButtonText color="$white">Editar</ButtonText>
            </Button>
          </HStack>
        </Box>
      </VStack>
    </>
  );

  const renderForm = () => (
    <>
      <Header title="Editar perfil" />
      <VStack px="$6" py="$6" space="$5">
        <Box
          bg="$white"
          borderRadius="$2xl"
          p="$5"
          borderWidth={1}
          borderColor="$coolGray200"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          }}
        >
          <VStack space="$5">
            <FormControl isInvalid={!!errors.nombre}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Nombre</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="badge" /></InputSlot>
                <InputField
                  placeholder="Tu nombre"
                  value={form.nombre}
                  onChangeText={(v) => {
                    setForm((f) => ({ ...f, nombre: v }));
                    if (errors.nombre) setErrors((e) => ({ ...e, nombre: null }));
                  }}
                />
              </Input>
              {!!errors.nombre && (
                <FormControlError mt="$1">
                  <FormControlErrorText>{errors.nombre}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.apellidos}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Apellidos</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="badge" /></InputSlot>
                <InputField
                  placeholder="Tus apellidos"
                  value={form.apellidos}
                  onChangeText={(v) => {
                    setForm((f) => ({ ...f, apellidos: v }));
                    if (errors.apellidos) setErrors((e) => ({ ...e, apellidos: null }));
                  }}
                />
              </Input>
              {!!errors.apellidos && (
                <FormControlError mt="$1">
                  <FormControlErrorText>{errors.apellidos}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.correo}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Correo</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="mail-outline" /></InputSlot>
                <InputField
                  placeholder="correo@dominio.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={form.correo}
                  onChangeText={(v) => {
                    setForm((f) => ({ ...f, correo: v }));
                    if (errors.correo) setErrors((e) => ({ ...e, correo: null }));
                  }}
                />
              </Input>
              {!!errors.correo && (
                <FormControlError mt="$1">
                  <FormControlErrorText>{errors.correo}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.telefono}>
              <FormControlLabel>
                <FormControlLabelText fontWeight="$bold" color="$black">Teléfono</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot pl="$3"><InputIcon as={MaterialIcons} name="phone-android" /></InputSlot>
                <InputField
                  placeholder="+52 55 1234 5678"
                  keyboardType="phone-pad"
                  value={form.telefono}
                  onChangeText={(v) => {
                    setForm((f) => ({ ...f, telefono: v }));
                    if (errors.telefono) setErrors((e) => ({ ...e, telefono: null }));
                  }}
                />
              </Input>
              {!!errors.telefono && (
                <FormControlError mt="$1">
                  <FormControlErrorText>{errors.telefono}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <VStack space="$3" mt="$2">
              <Button bg="$red600" onPress={saveProfile}>
                <ButtonText color="$white">Guardar cambios</ButtonText>
              </Button>
              <Button variant="outline" onPress={() => setEditing(false)}>
                <ButtonText>Cancelar</ButtonText>
              </Button>
            </VStack>
          </VStack>
        </Box>
      </VStack>
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <Box flex={1} bg="$white">
        {editing ? renderForm() : renderProfile()}

        {/* Modal confirmación editar */}
        {showConfirmEdit && (
          <>
            <Box position="absolute" top={0} left={0} right={0} bottom={0} bg="$black" opacity={0.15} zIndex={10} />
            <Box
              position="absolute"
              left={24}
              right={24}
              top={180}
              bg="$white"
              p="$6"
              borderRadius="$2xl"
              zIndex={20}
              borderWidth={1}
              borderColor="$coolGray200"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 5,
              }}
            >
              <HStack space="$3" alignItems="center" mb="$3">
                <Icon as={MaterialIcons} name="edit" size={24} color="$red600" />
                <Text fontSize="$lg" fontWeight="$bold" color="$black">Confirmar cambios</Text>
              </HStack>
              <Text color="$coolGray700" mb="$5">
                ¿Estás seguro de que quieres guardar los cambios en tu perfil?
              </Text>
              <HStack space="$3">
                <Button variant="outline" onPress={() => setShowConfirmEdit(false)} flex={1}>
                  <ButtonText>Cancelar</ButtonText>
                </Button>
                <Button bg="$red600" onPress={confirmEdit} flex={1}>
                  <ButtonText color="$white">Sí, guardar</ButtonText>
                </Button>
              </HStack>
            </Box>
          </>
        )}

        {/* Modal confirmación eliminar */}
        {showConfirmDelete && (
          <>
            <Box position="absolute" top={0} left={0} right={0} bottom={0} bg="$black" opacity={0.15} zIndex={10} />
            <Box
              position="absolute"
              left={24}
              right={24}
              top={120}
              bg="$white"
              p="$6"
              borderRadius="$2xl"
              zIndex={20}
              borderWidth={1}
              borderColor="$coolGray200"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 5,
              }}
            >
              <HStack space="$3" alignItems="center" mb="$3">
                <Icon as={MaterialIcons} name="warning-amber" size={24} color="$red600" />
                <Text fontSize="$lg" fontWeight="$bold" color="$black">Eliminar cuenta</Text>
              </HStack>
              <Text color="$coolGray700" mb="$5">
                ¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.
              </Text>
              <HStack space="$3">
                <Button variant="outline" onPress={() => setShowConfirmDelete(false)} flex={1}>
                  <ButtonText>Cancelar</ButtonText>
                </Button>
                <Button bg="$red600" onPress={confirmDelete} flex={1}>
                  <ButtonText color="$white">Sí, eliminar</ButtonText>
                </Button>
              </HStack>
            </Box>
          </>
        )}
      </Box>
    </SafeAreaView>
  );
}
