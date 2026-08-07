const STORAGE_KEY = 'ventix_equipments';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getEquipments() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao carregar equipamentos:', error);
    return [];
  }
}

export function saveEquipments(equipments) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(equipments));
  } catch (error) {
    console.error('Erro ao salvar equipamentos:', error);
  }
}

export function createEquipment(data) {
  const equipments = getEquipments();

  const newEquipment = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updatedEquipments = [...equipments, newEquipment];

  saveEquipments(updatedEquipments);

  return newEquipment;
}

export function updateEquipment(id, data) {
  const equipments = getEquipments();

  const updatedEquipments = equipments.map((equipment) =>
    equipment.id === id
      ? {
          ...equipment,
          ...data,
          id: equipment.id,
          updated_at: new Date().toISOString(),
        }
      : equipment
  );

  saveEquipments(updatedEquipments);

  return updatedEquipments.find(
    (equipment) => equipment.id === id
  );
}

export function deleteEquipment(id) {
  const equipments = getEquipments();

  const updatedEquipments = equipments.filter(
    (equipment) => equipment.id !== id
  );

  saveEquipments(updatedEquipments);

  return true;
}

export function getEquipmentById(id) {
  const equipments = getEquipments();

  return equipments.find(
    (equipment) => equipment.id === id
  ) || null;
}

export function clearEquipments() {
  localStorage.removeItem(STORAGE_KEY);
}