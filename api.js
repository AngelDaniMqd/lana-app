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
  const res = await fetch(`${API_BASE_URL}/categoria_metodos/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('No se pudieron obtener los métodos');
  return await res.json(); // esperado: [{ id, nombre }, ...]
}

// (Opcional) CRUD de métodos si lo necesitas en pantallas de administración:
export async function postMetodo(nombre, token) {
  const res = await fetch(`${API_BASE_URL}/categoria_metodos/`, {
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
  const res = await fetch(`${API_BASE_URL}/categoria_metodos/${id}`, {
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
  const res = await fetch(`${API_BASE_URL}/categoria_metodos/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
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
  const res = await fetch(`${API_BASE_URL}/registros/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      lista_cuentas_id: data.lista_cuentas_id,
      subCategorias_id: data.subCategorias_id,
      monto: data.monto,
      categori_metodos_id: data.categori_metodos_id,
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'No se pudo crear el registro');
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
