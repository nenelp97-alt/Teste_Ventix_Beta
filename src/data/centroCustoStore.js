const STORAGE_KEY = 'ventix_centros_custo';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getCentrosCusto() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao carregar centros de custo:', error);
    return [];
  }
}

export function saveCentrosCusto(centros) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(centros)
    );
  } catch (error) {
    console.error('Erro ao salvar centros de custo:', error);
  }
}

export function createCentroCusto(data) {
  const centros = getCentrosCusto();

  const newCentro = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updatedCentros = [
    ...centros,
    newCentro,
  ];

  saveCentrosCusto(updatedCentros);

  return newCentro;
}

export function updateCentroCusto(id, data) {
  const centros = getCentrosCusto();

  const updatedCentros = centros.map((centro) =>
    centro.id === id
      ? {
          ...centro,
          ...data,
          id: centro.id,
          updated_at: new Date().toISOString(),
        }
      : centro
  );

  saveCentrosCusto(updatedCentros);

  return updatedCentros.find(
    (centro) => centro.id === id
  );
}

export function deleteCentroCusto(id) {
  const centros = getCentrosCusto();

  const updatedCentros = centros.filter(
    (centro) => centro.id !== id
  );

  saveCentrosCusto(updatedCentros);

  return true;
}

export function getCentroCustoById(id) {
  const centros = getCentrosCusto();

  return centros.find(
    (centro) => centro.id === id
  ) || null;
}

export function clearCentrosCusto() {
  localStorage.removeItem(STORAGE_KEY);
}