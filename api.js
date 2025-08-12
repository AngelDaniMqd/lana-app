// api.js
const API_BASE_URL = 'https://apilanaapp-production.up.railway.app';

export const API_ROUTES = {
  LOGIN: `${API_BASE_URL}/usuarios/login`,
  REGISTER: `${API_BASE_URL}/usuarios/`,
  USERS: `${API_BASE_URL}/usuarios`,
};

export default API_ROUTES;

/* ================== Usuarios ================== */

export async function putUser(userId, data, token) {
  const dataToSend = {
    ...data,
    telefono: data.telefono ? Number(data.telefono) : undefined,
  };

  const body = new URLSearchParams(
    Object.entries(dataToSend).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null) acc[k] = String(v);
      return acc;
    }, {})
  ).toString();

  const res = await fetch(`${API_ROUTES.USERS}/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  let payload;
  try {
    payload = await res.json();
  } catch {
    try {
      payload = await res.text();
    } catch {
      payload = null;
    }
  }

  return {
    ok: res.ok,
    status: res.status,
    json: typeof payload === 'object' ? payload : undefined,
    text: typeof payload === 'string' ? payload : undefined,
  };
}

export async function deleteUser(userId, token) {
  const response = await fetch(`${API_ROUTES.USERS}/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  let text = '';
  if (response.status !== 204) {
    try {
      text = await response.text();
    } catch (e) {
      /* noop */
    }
  }
  return { ok: response.ok, status: response.status, text };
}

/* ================== Cuentas (CRUD simple) ================== */

export async function getCuentas(token) {
  const res = await fetch(`${API_BASE_URL}/lista_cuentas/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('No se pudieron obtener las cuentas');
  return await res.json();
}

export async function postCuenta({ nombre, cantidad }, token) {
  const res = await fetch(`${API_BASE_URL}/lista_cuentas/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({ nombre, cantidad }).toString(),
  });
  if (!res.ok) throw new Error('No se pudo crear la cuenta');
  return await res.json();
}

export async function putCuenta(cuentaId, data, token) {
  const res = await fetch(`${API_BASE_URL}/lista_cuentas/${cuentaId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      nombre: data.nombre,
      cantidad: data.cantidad,
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No se pudo actualizar la cuenta');
  }
  return await res.json();
}

export async function deleteCuenta(cuentaId, token) {
  const res = await fetch(`${API_BASE_URL}/lista_cuentas/${cuentaId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No se pudo eliminar la cuenta');
  }
  try {
    return await res.json();
  } catch {
    return { ok: true };
  }
}

/* ================== Gráficos (Analytics) ================== */

export async function getGraficoResumen(token) {
  const res = await fetch(`${API_BASE_URL}/graficos/resumen`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('No se pudo obtener el resumen de gráficos');
  return await res.json();
}

export async function getGraficoPorDias(token, dias = 30) {
  const url = `${API_BASE_URL}/graficos/por-dias?dias=${encodeURIComponent(dias)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('No se pudo obtener el gráfico por días');
  return await res.json();
}

export async function getGraficoCuentas(token) {
  const res = await fetch(`${API_BASE_URL}/graficos/cuentas`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('No se pudo obtener el resumen por cuentas');
  return await res.json();
}

export async function getGraficoCircularGastos(token, dias = 30) {
  const url = `${API_BASE_URL}/graficos/circular-gastos?dias=${encodeURIComponent(dias)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('No se pudo obtener la gráfica circular de gastos');
  return await res.json();
}

export async function getGraficoCircularIngresos(token, dias = 30) {
  const url = `${API_BASE_URL}/graficos/circular-ingresos?dias=${encodeURIComponent(dias)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('No se pudo obtener la gráfica circular de ingresos');
  return await res.json();
}

/* ================== Catálogos: Categorías / Subcategorías / Métodos ================== */

export async function getCategorias(token) {
  const res = await fetch(`${API_BASE_URL}/categorias/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('No se pudieron obtener las categorías');
  return await res.json();
}

export async function getSubcategorias(token) {
  const res = await fetch(`${API_BASE_URL}/subcategorias/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('No se pudieron obtener las subcategorías');
  return await res.json();
}

/* ===== Métodos de pago/uso (categoria_metodos) — NOMBRE CORREGIDO ===== */
export async function getMetodos(token) {
  const res = await fetch(`${API_BASE_URL}/categori_metodos/`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('No se pudieron obtener los métodos');
  return await res.json(); // [{ id, nombre }, ...]
}

export async function postMetodo(nombre, token) {
  const res = await fetch(`${API_BASE_URL}/categori_metodos/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({ nombre }).toString(),
  });
  if (!res.ok) throw new Error('No se pudo crear el método');
  return await res.json();
}

export async function putMetodo(id, nombre, token) {
  const res = await fetch(`${API_BASE_URL}/categori_metodos/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({ nombre }).toString(),
  });
  if (!res.ok) throw new Error('No se pudo actualizar el método');
  return await res.json();
}

export async function deleteMetodo(id, token) {
  const res = await fetch(`${API_BASE_URL}/categori_metodos/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudo eliminar el método');
  }
  try {
    return await res.json();
  } catch {
    return { ok: true };
  }
}


/* ================== Usuarios: SMS (clasificador) ================== */

export async function postUsuarioSms(mensaje, token) {
  const res = await fetch(`${API_BASE_URL}/usuarios/sms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({ mensaje }).toString(),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudo clasificar el SMS');
  }
  return await res.json().catch(() => ({}));
}

/* ================== Registros (CRUD) ================== */

export async function getRegistros(token) {
  const res = await fetch(`${API_BASE_URL}/registros/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('No se pudieron obtener los registros');
  return await res.json();
}

/**
 * Crea un registro financiero
 * @param {object} data - { lista_cuentas_id, subCategorias_id, monto, categori_metodos_id }
 */
export async function postRegistro(data, token) {
  // Construye el payload omitiendo nulos/vacíos y forzando string
  const payload = {
    lista_cuentas_id: String(data.lista_cuentas_id),
    subCategorias_id: String(data.subCategorias_id),
    monto: String(data.monto),
  };
  if (data.categori_metodos_id !== undefined && data.categori_metodos_id !== null && data.categori_metodos_id !== '') {
    payload.categori_metodos_id = String(data.categori_metodos_id);
  }

  const res = await fetch(`${API_BASE_URL}/registros/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams(payload).toString(),
  });

  if (!res.ok) {
    // ayuda extra para depurar
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'No se pudo crear el registro');
  }
  return await res.json();
}

export async function putRegistro(registroId, data, token) {
  const res = await fetch(`${API_BASE_URL}/registros/${registroId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      ...(data.lista_cuentas_id != null ? { lista_cuentas_id: data.lista_cuentas_id } : {}),
      ...(data.subCategorias_id != null ? { subCategorias_id: data.subCategorias_id } : {}),
      ...(data.monto != null ? { monto: data.monto } : {}),
      ...(data.categori_metodos_id != null ? { categori_metodos_id: data.categori_metodos_id } : {}),
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudo actualizar el registro');
  }
  return await res.json();
}

export async function deleteRegistro(registroId, token) {
  const res = await fetch(`${API_BASE_URL}/registros/${registroId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudo eliminar el registro');
  }
  try {
    return await res.json();
  } catch {
    return { ok: true };
  }
}


// ====== Deudas (CRUD) ======
export async function getDeudas(token) {
  const res = await fetch(`${API_BASE_URL}/deudas/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('No se pudieron obtener las deudas');
  return await res.json();
}

/**
 * Crea una deuda
 * @param {object} data - { nombre, monto, fecha_inicio (ISO), fecha_vencimiento (ISO), descripcion, categori_metodos_id }
 */
export async function postDeuda(data, token) {
  const body = new URLSearchParams({
    nombre: String(data.nombre),
    monto: String(data.monto),
    fecha_inicio: String(data.fecha_inicio),         // ISO
    fecha_vencimiento: String(data.fecha_vencimiento), // ISO
    descripcion: String(data.descripcion ?? ''),
    categori_metodos_id: String(data.categori_metodos_id),
  }).toString();

  const res = await fetch(`${API_BASE_URL}/deudas/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'No se pudo crear la deuda');
  }
  return await res.json();
}

/**
 * Actualiza una deuda
 * @param {number|string} deudaId
 * @param {object} data - campos opcionales
 */
export async function putDeuda(deudaId, data, token) {
  const payload = new URLSearchParams(
    Object.entries({
      ...(data.nombre != null ? { nombre: data.nombre } : {}),
      ...(data.monto != null ? { monto: data.monto } : {}),
      ...(data.fecha_inicio != null ? { fecha_inicio: data.fecha_inicio } : {}),
      ...(data.fecha_vencimiento != null ? { fecha_vencimiento: data.fecha_vencimiento } : {}),
      ...(data.descripcion != null ? { descripcion: data.descripcion } : {}),
      ...(data.categori_metodos_id != null ? { categori_metodos_id: data.categori_metodos_id } : {}),
    }).reduce((acc, [k, v]) => ((acc[k] = String(v)), acc), {})
  ).toString();

  const res = await fetch(`${API_BASE_URL}/deudas/${deudaId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: payload,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'No se pudo actualizar la deuda');
  }
  return await res.json();
}

export async function deleteDeuda(deudaId, token) {
  const res = await fetch(`${API_BASE_URL}/deudas/${deudaId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'No se pudo eliminar la deuda');
  }
  try {
    return await res.json();
  } catch {
    return { ok: true };
  }
}



/* ================== Objetivos (CRUD + estado + aportes) ================== */

export async function getObjetivos(token, estado) {
  let url = `${API_BASE_URL}/objetivos/`;
  if (estado) url += `?estado=${encodeURIComponent(estado)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('No se pudieron obtener los objetivos');
  return await res.json();
}

export async function postObjetivo(data, token) {
  const res = await fetch(`${API_BASE_URL}/objetivos/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      nombre: String(data.nombre),
      tipo: String(data.tipo),
      monto_meta: Number(data.monto_meta),
      fecha_inicio: String(data.fecha_inicio),
      fecha_vencimiento: String(data.fecha_vencimiento),
    }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'No se pudo crear el objetivo');
  }
  return await res.json();
}

export async function putObjetivo(objetivoId, data, token) {
  const res = await fetch(`${API_BASE_URL}/objetivos/${objetivoId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      ...(data.nombre != null ? { nombre: String(data.nombre) } : {}),
      ...(data.tipo != null ? { tipo: String(data.tipo) } : {}),
      ...(data.monto_meta != null ? { monto_meta: Number(data.monto_meta) } : {}),
      ...(data.fecha_inicio != null ? { fecha_inicio: String(data.fecha_inicio) } : {}),
      ...(data.fecha_vencimiento != null ? { fecha_vencimiento: String(data.fecha_vencimiento) } : {}),
    }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'No se pudo actualizar el objetivo');
  }
  return await res.json();
}

export async function deleteObjetivo(objetivoId, token) {
  const res = await fetch(`${API_BASE_URL}/objetivos/${objetivoId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'No se pudo eliminar el objetivo');
  }
  return { ok: true };
}

export async function patchObjetivoEstado(objetivoId, estado, token) {
  const res = await fetch(`${API_BASE_URL}/objetivos/${objetivoId}/estado`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ estado: String(estado) }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'No se pudo cambiar el estado');
  }
  return await res.json();
}

// (Opcional) Aportes
export async function postAporte(objetivoId, { monto, nota = '' }, token) {
  const res = await fetch(`${API_BASE_URL}/objetivos/${objetivoId}/aportes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ monto: Number(monto), nota: String(nota) }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'No se pudo crear el aporte');
  }
  return await res.json();
}

export async function getAportes(objetivoId, token) {
  const res = await fetch(`${API_BASE_URL}/objetivos/${objetivoId}/aportes`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('No se pudieron obtener los aportes');
  return await res.json();
}



// === PRESUPUESTOS ===
export const PRESUPUESTOS_ROUTES = {
  BASE: `${API_BASE_URL}/presupuestos`,
  ACTIVOS: `${API_BASE_URL}/presupuestos/activos`,
};

export async function getPresupuestos(token) {
  const res = await fetch(`${PRESUPUESTOS_ROUTES.BASE}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudieron obtener los presupuestos');
  }
  return await res.json(); // [{ id, usuarios_id, categorias_id, monto_limite, estado, fecha_creacion, categoria_nombre, gastado, restante, porcentaje_usado, excedido }, ...]
}

export async function getPresupuestosActivos(token) {
  const res = await fetch(`${PRESUPUESTOS_ROUTES.ACTIVOS}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudieron obtener los presupuestos activos');
  }
  return await res.json();
}

/**
 * Crea un presupuesto
 * @param {object} data - { categorias_id: number, monto_limite: number, estado?: 'activo'|'inactivo' }
 */
export async function postPresupuesto(data, token) {
  const payload = new URLSearchParams(
    Object.entries({
      categorias_id: String(data.categorias_id),
      monto_limite: String(data.monto_limite),
      ...(data.estado ? { estado: String(data.estado) } : {}),
    })
  ).toString();

  const res = await fetch(`${PRESUPUESTOS_ROUTES.BASE}/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: payload,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudo crear el presupuesto');
  }
  return await res.json();
}

/**
 * Actualiza un presupuesto
 * @param {number|string} id
 * @param {object} data - { categorias_id?, monto_limite?, estado? }
 */
export async function putPresupuesto(id, data, token) {
  const filtered = Object.fromEntries(
    Object.entries({
      categorias_id: data.categorias_id,
      monto_limite: data.monto_limite,
      estado: data.estado,
    }).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );

  const payload = new URLSearchParams(
    Object.entries(filtered).reduce((acc, [k, v]) => ((acc[k] = String(v)), acc), {})
  ).toString();

  const res = await fetch(`${PRESUPUESTOS_ROUTES.BASE}/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: payload,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudo actualizar el presupuesto');
  }
  return await res.json();
}

export async function patchPresupuestoEstado(id, estado, token) {
  const payload = new URLSearchParams({ estado: String(estado) }).toString();

  const res = await fetch(`${PRESUPUESTOS_ROUTES.BASE}/${id}/estado`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: payload,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudo cambiar el estado del presupuesto');
  }
  return await res.json();
}

export async function deletePresupuesto(id, token) {
  const res = await fetch(`${PRESUPUESTOS_ROUTES.BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudo eliminar el presupuesto');
  }
  try {
    return await res.json();
  } catch {
    return { ok: true };
  }
}


// === PAGOS FIJOS ===
export const PAGOS_FIJOS_ROUTES = {
  BASE: `${API_BASE_URL}/pagos-fijos`,
  PROXIMOS: `${API_BASE_URL}/pagos-fijos/proximos`,
};

export async function getPagosFijos(token) {
  const res = await fetch(`${PAGOS_FIJOS_ROUTES.BASE}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudieron obtener los pagos fijos');
  }
  return await res.json(); // [{ id, usuarios_id, nombre, monto, dia_pago, activo, fecha_creacion }, ...]
}

export async function getPagosProximos(token) {
  const res = await fetch(`${PAGOS_FIJOS_ROUTES.PROXIMOS}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudieron obtener los pagos próximos');
  }
  return await res.json();
}

/**
 * Crear pago fijo
 * body: { nombre: string, monto: number, dia_pago: 1..31 }
 */
export async function postPagoFijo(data, token) {
  const payload = new URLSearchParams({
    nombre: String(data.nombre),
    monto: String(data.monto),
    dia_pago: String(data.dia_pago),
  }).toString();

  const res = await fetch(`${PAGOS_FIJOS_ROUTES.BASE}/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: payload,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudo crear el pago fijo');
  }
  return await res.json();
}

/**
 * Actualizar pago fijo
 * id: number
 * data (opcionales): { nombre?, monto?, dia_pago?, activo? }  // activo: 0|1
 */
export async function putPagoFijo(id, data, token) {
  const filtered = Object.fromEntries(
    Object.entries({
      nombre: data.nombre,
      monto: data.monto,
      dia_pago: data.dia_pago,
      activo: data.activo,
    }).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );

  const payload = new URLSearchParams(
    Object.entries(filtered).reduce((acc, [k, v]) => ((acc[k] = String(v)), acc), {})
  ).toString();

  const res = await fetch(`${PAGOS_FIJOS_ROUTES.BASE}/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: payload,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudo actualizar el pago fijo');
  }
  return await res.json();
}

export async function deletePagoFijo(id, token) {
  const res = await fetch(`${PAGOS_FIJOS_ROUTES.BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudo eliminar el pago fijo');
  }
  try {
    return await res.json();
  } catch {
    return { ok: true };
  }
}





// === GRAFICOS ===
export async function getGraficosResumen(token) {
  const res = await fetch(`${API_BASE_URL}/graficos/resumen`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(await res.text().catch(()=>'') || 'No se pudo obtener el resumen');
  return await res.json(); // { total_saldo, total_movimientos, ingresos_mes, gastos_mes, balance_mes, usuario }
}

export async function getGraficosPorDias(token, dias = 30) {
  const res = await fetch(`${API_BASE_URL}/graficos/por-dias?dias=${encodeURIComponent(dias)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(await res.text().catch(()=>'') || 'No se pudo obtener movimientos por días');
  return await res.json(); // { periodo, fecha_inicio, fecha_fin, resumen_diario: [{fecha, ingresos, gastos, balance, cantidad_movimientos}] }
}

export async function getGraficosPorCategoria(token, dias = 30) {
  const res = await fetch(`${API_BASE_URL}/graficos/por-categoria?dias=${encodeURIComponent(dias)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(await res.text().catch(()=>'') || 'No se pudieron obtener categorías');
  return await res.json(); // { total_ingresos, total_gastos, categorias: [{categoria, ingresos, gastos, ...}] }
}

export async function getGraficosTendenciaMensual(token) {
  const res = await fetch(`${API_BASE_URL}/graficos/tendencia-mensual`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(await res.text().catch(()=>'') || 'No se pudo obtener tendencia mensual');
  return await res.json(); // { tendencia_mensual: [{año, mes, mes_nombre, ingresos, gastos, balance, cantidad}] }
}

export async function getGraficosCuentas(token) {
  const res = await fetch(`${API_BASE_URL}/graficos/cuentas`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(await res.text().catch(()=>'') || 'No se pudo obtener cuentas');
  return await res.json(); // { total_saldo, cuentas: [{id, nombre, saldo, movimientos}] }
}

export async function getCircularGastos(token, dias = 30) {
  const res = await fetch(`${API_BASE_URL}/graficos/circular-gastos?dias=${encodeURIComponent(dias)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(await res.text().catch(()=>'') || 'No se pudo obtener circular de gastos');
  return await res.json(); // { total_gastos, categorias_gastos: [{categoria, monto, porcentaje}] }
}

export async function getCircularIngresos(token, dias = 30) {
  const res = await fetch(`${API_BASE_URL}/graficos/circular-ingresos?dias=${encodeURIComponent(dias)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(await res.text().catch(()=>'') || 'No se pudo obtener circular de ingresos');
  return await res.json(); // { total_ingresos, categorias_ingresos: [{categoria, monto, porcentaje}] }
}
