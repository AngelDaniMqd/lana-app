import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import {
  Box, VStack, HStack, Text, Button, ButtonText, Icon, Pressable, Spinner, Divider,
  FormControl, FormControlLabel, FormControlLabelText, FormControlError, FormControlErrorText,
  Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectItem,
  Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel,
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import AppMenuPopover from '../components/AppMenuPopover';
import { getCategorias, getSubcategorias, getCuentas, postRegistro } from '../api';

// === Teclado sin ".", sin *, sin /, sin +, sin - ===
const KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  [' ','0', '←'],
];

const KeyButton = React.memo(function KeyButton({ label, onPress, onLongPress }) {
  const isBack = label === '←';
  const variant = isBack ? 'outline' : 'solid';
  const bg = variant === 'solid' ? '$coolGray100' : '$white';
  return (
    <Button
      onPress={() => onPress(label)}
      onLongPress={isBack ? onLongPress : undefined}
      variant={variant}
      bg={bg}
      borderColor="$coolGray300"
      borderWidth={1}
      borderRadius="$lg"
      w="$20"
      h="$20"
      justifyContent="center"
      alignItems="center"
    >
      <ButtonText fontSize="$2xl" color="$black">
        {label}
      </ButtonText>
    </Button>
  );
});

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
    monto: '',       // SIN signo; solo dígitos
    categoriaId: '',
    subcategoriaId: '',
    cuentaId: '',
  });

  // ---------- Catálogos ----------
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // Solo enteros (sin punto)
  const validMoney = useCallback((v) => /^\d+$/.test(String(v)), []);

  const isValid = useMemo(() => {
    return (
      form.monto &&
      validMoney(form.monto) &&
      form.categoriaId &&
      form.subcategoriaId &&
      form.cuentaId
    );
  }, [form, validMoney]);

  const filteredSubcats = useMemo(() => {
    if (!form.categoriaId) return [];
    return subcategorias.filter(s => String(s.categorias_id) === String(form.categoriaId));
  }, [form.categoriaId, subcategorias]);

  // ---------- Cargar catálogos y cuentas ----------
  useEffect(() => {
    if (!token) return;
    let mounted = true;
    setLoadingCatalogs(true);

    Promise.allSettled([getCategorias(token), getSubcategorias(token), getCuentas(token)])
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
  const handleKeyPress = useCallback((key) => {
    setForm((prev) => {
      let monto = prev.monto || '';

      if (key === '←') {
        return { ...prev, monto: monto.length ? monto.slice(0, -1) : '' };
      }

      // Solo dígitos
      if (/^\d$/.test(key)) {
        if (monto === '0') {
          // Reemplaza el 0 inicial por el nuevo dígito
          return { ...prev, monto: key };
        }
        return { ...prev, monto: monto + key };
      }

      return prev;
    });
  }, []);

  const handleBackspaceLong = useCallback(() => {
    setForm((f) => ({ ...f, monto: '' }));
  }, []);

  // ---------- Guardar ----------
  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      alert('Verifica todos los campos obligatorios.');
      return;
    }

    // Aplica signo según método
    let raw = String(form.monto);
    if (!raw) raw = '0';

    const signedMonto = form.metodo === 'gasto' ? `-${raw}` : raw;

    try {
      await postRegistro(
        {
          lista_cuentas_id: Number(form.cuentaId),
          subCategorias_id: Number(form.subcategoriaId),
          monto: signedMonto,
        },
        token
      );
      alert('Registro guardado correctamente.');
      onSave();
    } catch (e) {
      alert('Error al guardar el registro');
    }
  }, [form.monto, form.metodo, form.cuentaId, form.subcategoriaId, isValid, onSave, token]);

  // Monto mostrado con signo (visual)
  const displayAmount = useMemo(() => {
    const base = form.monto || '0';
    return form.metodo === 'gasto' ? `-${base}` : base;
  }, [form.monto, form.metodo]);

  const amountColor = form.metodo === 'gasto' ? '$red700' : '$green700';

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
              {/* Método (elige el signo) */}
              <VStack px="$6" py="$4" space="$3">
                <Text fontWeight="$bold" fontSize="$md" color="$black">Selecciona Método:</Text>
                <RadioGroup
                  value={form.metodo}
                  onChange={(v) => setForm((f) => ({ ...f, metodo: String(v) }))}
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
                    color={amountColor}
                  >
                    {displayAmount}
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
            <Box px="$6" pt="$3" pb="$5" bg="$white" borderTopWidth={1} borderTopColor="$coolGray200">
              <VStack space="$3">
                {KEYS.map((row, i) => (
                  <HStack key={i} space="$3" justifyContent="space-between">
                    {row.map((label) => (
                      <KeyButton
                        key={label}
                        label={label}
                        onPress={handleKeyPress}
                        onLongPress={handleBackspaceLong}
                      />
                    ))}
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
