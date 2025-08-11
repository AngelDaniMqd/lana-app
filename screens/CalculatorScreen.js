import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import {
  Box, VStack, HStack, Text, Button, ButtonText, Icon, Pressable, Spinner,
  FormControl, FormControlLabel, FormControlLabelText, FormControlError, FormControlErrorText,
  Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectItem,
  Divider,
  Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel,
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import AppMenuPopover from '../components/AppMenuPopover';
import { getCategorias, getSubcategorias, getCuentas, postRegistro } from '../api';

const keypad = [
  ['7', '8', '9', '/'],
  ['4', '5', '6', '*'],
  ['1', '2', '3', '-'],
  ['.', '0', '←', '+'],
];

export default function CalculatorScreen({
  token,
  user,
  onBack = () => {},
  onHome = () => {},
  onNotifications = () => {},
  onSave = () => {},
}) {
  const [showPopover, setShowPopover] = useState(false);

  // ---------- Estado del formulario ----------
  const [form, setForm] = useState({
    metodo: 'gasto', // 'ingreso' | 'gasto'
    monto: '',
    categoriaId: '',
    subcategoriaId: '',
    cuentaId: '',
    metodoPagoId: '',
  });

  // ---------- Catálogos ----------
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const validMoney = (v) => /^-?\d+([.,]\d{1,2})?$/.test(String(v).replace(',', '.'));
  const isValid =
    form.monto &&
    validMoney(form.monto) &&
    form.categoriaId &&
    form.subcategoriaId &&
    form.cuentaId;

  const filteredSubcats = useMemo(() => {
    if (!form.categoriaId) return [];
    return subcategorias.filter(s => String(s.categorias_id) === String(form.categoriaId));
  }, [form.categoriaId, subcategorias]);

  // ---------- Cargar catálogos y cuentas ----------
  useEffect(() => {
    if (!token) return;
    let mounted = true;
    setLoadingCatalogs(true);

    Promise.allSettled([
      getCategorias(token),
      getSubcategorias(token),
      getCuentas(token)
    ])
      .then(([r1, r2, r3]) => {
        if (!mounted) return;
        if (r1.status === 'fulfilled') setCategorias(r1.value || []);
        if (r2.status === 'fulfilled') setSubcategorias(r2.value || []);
        if (r3.status === 'fulfilled') setCuentas(r3.value || []);
      })
      .finally(() => mounted && setLoadingCatalogs(false));

    return () => { mounted = false; };
  }, [token]);

  // ---------- Teclado ----------
  const isOperator = (k) => ['/', '*', '-', '+'].includes(k);

  const handleKeyPress = (key) => {
    if (key === '←') {
      setForm((f) => ({ ...f, monto: f.monto.length ? f.monto.slice(0, -1) : '' }));
      return;
    }
    if (isOperator(key)) {
      // Solo permite un signo al inicio
      if (form.monto.length === 0 && (key === '-' || key === '+')) {
        setForm((f) => ({ ...f, monto: key }));
      }
      return;
    }
    if (key === '.' && form.monto.includes('.')) return;
    setForm((f) => ({ ...f, monto: f.monto === '0' && key !== '.' ? key : f.monto + key }));
  };

  const handleBackspaceLong = () => setForm((f) => ({ ...f, monto: '' }));

  // ---------- Guardar ----------
  const handleSubmit = async () => {
    if (!isValid) {
      alert('Verifica todos los campos obligatorios.');
      return;
    }
    try {
      await postRegistro(
        {
          lista_cuentas_id: Number(form.cuentaId),
          subCategorias_id: Number(form.subcategoriaId),
          monto: String(form.monto).replace(',', '.'),
          categori_metodos_id: form.metodoPagoId ? Number(form.metodoPagoId) : 1, // Si tienes método de pago, úsalo, si no, manda 1
        },
        token
      );
      alert('Registro guardado correctamente.');
      onSave();
    } catch (e) {
      alert('Error al guardar el registro');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <Box flex={1} bg="$white">
        {/* Header */}
        <HStack alignItems="center" justifyContent="space-between" px="$4" py="$3" bg="$white">
          <Pressable onPress={onBack}>
            <HStack alignItems="center" space="$1.5">
              <Icon as={MaterialIcons} name="arrow-back-ios" size={20} color="$black" />
              <Text color="$black">Regresar</Text>
            </HStack>
          </Pressable>
          <Pressable onPress={handleSubmit}>
            <Icon as={MaterialIcons} name="check" size={24} color="$black" />
          </Pressable>
        </HStack>
        <Divider />

        {loadingCatalogs ? (
          <VStack flex={1} alignItems="center" justifyContent="center" space="$2">
            <Spinner />
            <Text color="$coolGray600">Cargando catálogos…</Text>
          </VStack>
        ) : (
          <>
            <ScrollView
              style={{ flex: 1, backgroundColor: '#fff' }}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Método */}
              <VStack px="$6" py="$4" space="$3">
                <Text fontWeight="$bold" fontSize="$md" color="$black">Selecciona Método:</Text>
                <RadioGroup
                  value={form.metodo}
                  onChange={(v) => setForm((f) => ({ ...f, metodo: String(v), monto: f.monto.startsWith('-') || f.monto.startsWith('+') ? '' : f.monto }))}
                  direction="row"
                  space="$10"
                >
                  <Radio value="ingreso">
                    <RadioIndicator mr="$2" borderColor="$coolGray500">
                      <RadioIcon as={MaterialIcons} name="circle" />
                    </RadioIndicator>
                    <RadioLabel>Ingreso</RadioLabel>
                  </Radio>
                  <Radio value="gasto">
                    <RadioIndicator mr="$2" borderColor="$coolGray500">
                      <RadioIcon as={MaterialIcons} name="circle" />
                    </RadioIndicator>
                    <RadioLabel>Gasto</RadioLabel>
                  </Radio>
                </RadioGroup>
              </VStack>
              <Divider />

              {/* Monto grande */}
              <VStack px="$6" py="$4" space="$2">
                <Box
                  bg="$white"
                  borderRadius="$xl"
                  borderWidth={1}
                  borderColor="$coolGray200"
                  px="$4"
                  py="$3"
                  alignItems="center"
                  style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 1,
                  }}
                >
                  <Text
                    fontSize="$5xl"
                    fontWeight="$bold"
                    textAlign="center"
                    color={form.metodo === 'gasto' ? '$black' : '$green700'}
                  >
                    {form.monto || (form.metodo === 'gasto' ? '-' : '+') + '0'}
                  </Text>
                </Box>
              </VStack>
              <Divider />

              {/* Cuenta */}
              <VStack px="$6" py="$2" space="$2">
                <FormControl isInvalid={!form.cuentaId}>
                  <FormControlLabel>
                    <FormControlLabelText fontWeight="$bold" color="$black">Cuenta</FormControlLabelText>
                  </FormControlLabel>
                  <Select
                    selectedValue={form.cuentaId}
                    onValueChange={(v) => setForm((f) => ({ ...f, cuentaId: v }))}
                  >
                    <SelectTrigger borderColor="$coolGray300" bg="$white">
                      <SelectInput placeholder="Selecciona una cuenta" />
                      <SelectIcon as={MaterialIcons} name="expand-more" />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        {cuentas.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)} label={c.nombre} />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                  {!form.cuentaId && (
                    <FormControlError mt="$1">
                      <FormControlErrorText>Selecciona una cuenta.</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>
              </VStack>

              {/* Categoría */}
              <VStack px="$6" py="$2" space="$2">
                <FormControl isInvalid={!form.categoriaId}>
                  <FormControlLabel>
                    <FormControlLabelText fontWeight="$bold" color="$black">Categoría</FormControlLabelText>
                  </FormControlLabel>
                  <Select
                    selectedValue={form.categoriaId}
                    onValueChange={(v) => {
                      setForm((f) => ({ ...f, categoriaId: v, subcategoriaId: '' }));
                    }}
                  >
                    <SelectTrigger borderColor="$coolGray300" bg="$white">
                      <SelectInput placeholder="Selecciona una categoría" />
                      <SelectIcon as={MaterialIcons} name="expand-more" />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        {categorias.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)} label={c.descripcion} />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                  {!form.categoriaId && (
                    <FormControlError mt="$1">
                      <FormControlErrorText>Selecciona una categoría.</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>
              </VStack>

              {/* Subcategoría */}
              <VStack px="$6" py="$2" space="$2">
                <FormControl isInvalid={!form.subcategoriaId}>
                  <FormControlLabel>
                    <FormControlLabelText fontWeight="$bold" color="$black">Subcategoría</FormControlLabelText>
                  </FormControlLabel>
                  <Select
                    isDisabled={!form.categoriaId}
                    selectedValue={form.subcategoriaId}
                    onValueChange={(v) => setForm((f) => ({ ...f, subcategoriaId: v }))}
                  >
                    <SelectTrigger borderColor="$coolGray300" bg="$white">
                      <SelectInput placeholder={form.categoriaId ? 'Selecciona una subcategoría' : 'Primero elige una categoría'} />
                      <SelectIcon as={MaterialIcons} name="expand-more" />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        {filteredSubcats.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)} label={s.descripcion} />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                  {!form.subcategoriaId && (
                    <FormControlError mt="$1">
                      <FormControlErrorText>Selecciona una subcategoría.</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>
              </VStack>

              <HStack space="$3" mt="$4" px="$6">
                <Button variant="outline" onPress={onBack} flex={1}>
                  <ButtonText>Cancelar</ButtonText>
                </Button>
                <Button bg="$red600" onPress={handleSubmit} flex={1} isDisabled={!isValid}>
                  <ButtonText color="$white">Guardar</ButtonText>
                </Button>
              </HStack>
            </ScrollView>

            {/* Teclado numérico */}
            <Box
              px="$6"
              pt="$3"
              pb="$5"
              bg="$white"
              borderTopWidth={1}
              borderTopColor="$coolGray200"
            >
              <VStack space="$3">
                {keypad.map((row, i) => (
                  <HStack key={i} space="$3" justifyContent="space-between">
                    {row.map((key) => {
                      const operator = isOperator(key) || key === '←';
                      const isBack = key === '←';
                      return (
                        <Button
                          key={key}
                          onPress={() => handleKeyPress(key)}
                          onLongPress={isBack ? handleBackspaceLong : undefined}
                          variant={operator ? 'outline' : 'solid'}
                          bg={operator ? '$white' : '$coolGray100'}
                          borderColor="$coolGray300"
                          borderWidth={1}
                          borderRadius="$lg"
                          w="$20"
                          h="$20"
                          justifyContent="center"
                          alignItems="center"
                        >
                          <ButtonText fontSize="$2xl" color="$black">
                            {key}
                          </ButtonText>
                        </Button>
                      );
                    })}
                  </HStack>
                ))}
              </VStack>
            </Box>
          </>
        )}
      </Box>
    </SafeAreaView>
  );
}
