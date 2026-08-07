import { createStore } from '@/data/localStore';

const authTokenKey = 'ventix_token';
const authUserIdKey = 'ventix_auth_user_id';

const usersStore = createStore('ventix_users');
const equipmentStore = createStore('ventix_equipments');
const maintenanceStore = createStore('ventix_maintenances');
const centroDeCustoStore = createStore('ventix_centros_de_custo');
const infrastructureMaintenanceStore = createStore('ventix_infrastructure_maintenances');
const fornecedorStore = createStore('ventix_fornecedores');
const materialStore = createStore('ventix_materials');
const gastoStore = createStore('ventix_gastos');
const gastoItemStore = createStore('ventix_gasto_items');

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function getCurrentUserId() {
  return localStorage.getItem(authUserIdKey);
}

async function getCurrentUser() {
  const userId = getCurrentUserId();
  if (!userId) return null;
  return usersStore.get(userId);
}

function setAuthForUser(user) {
  const token = `${user.id}:${Date.now()}`;
  localStorage.setItem(authTokenKey, token);
  localStorage.setItem(authUserIdKey, user.id);
  return token;
}

function clearAuth() {
  localStorage.removeItem(authTokenKey);
  localStorage.removeItem(authUserIdKey);
}

function createUserData(data) {
  const normalizedEmail = normalizeEmail(data.email);
  // Define se é o usuário mestre/admin (ex: usuário 'admin' ou 'mestre')
  const isMaster = normalizedEmail === 'admin@ventix.local' || normalizedEmail === 'mestre@ventix.local';

  return {
    email: normalizedEmail,
    password: String(data.password || ''),
    role: isMaster ? 'admin' : (data.role || 'user'),
    is_verified: true, // Já nasce verificado para acesso direto
    otp_code: null,
    reset_token: null,
    reset_token_expires_at: null,
    ...data,
  };
}

export const base44 = {
  auth: {
    me: async () => {
      const user = await getCurrentUser();
      if (!user || !user.is_verified) {
        const error = new Error('Unauthorized');
        error.status = 401;
        throw error;
      }
      return user;
    },

    loginViaEmailPassword: async (email, password) => {
      const normalized = normalizeEmail(email);
      const users = await usersStore.filter({ email: normalized });
      const user = users[0];
      if (!user || user.password !== String(password)) {
        const error = new Error('Usuário ou senha inválidos');
        error.status = 401;
        throw error;
      }
      if (!user.is_verified) {
        const error = new Error('Conta não verificada.');
        error.status = 403;
        throw error;
      }
      setAuthForUser(user);
      return { access_token: localStorage.getItem(authTokenKey), user };
    },

    loginWithProvider: async (provider, redirectPath = '/') => {
      const providerEmail = `${normalizeEmail(provider)}@ventix.local`;
      let [user] = await usersStore.filter({ email: providerEmail });
      if (!user) {
        user = await usersStore.create(createUserData({ email: providerEmail, password: '', is_verified: true, otp_code: null }));
      }
      setAuthForUser(user);
      if (typeof window !== 'undefined') {
        window.location.href = redirectPath;
      }
      return { access_token: localStorage.getItem(authTokenKey), user };
    },

    register: async ({ email, password }) => {
      const normalized = normalizeEmail(email);
      const existing = await usersStore.filter({ email: normalized });
      if (existing.length > 0) {
        const error = new Error('Já existe uma conta com este usuário');
        error.status = 409;
        throw error;
      }
      const newUser = await usersStore.create(createUserData({ email: normalized, password, is_verified: true }));
      return { email: newUser.email };
    },

    verifyOtp: async ({ email, otpCode }) => {
      const normalized = normalizeEmail(email);
      const users = await usersStore.filter({ email: normalized, otp_code: String(otpCode) });
      const user = users[0];
      if (!user) {
        const error = new Error('Código OTP inválido');
        error.status = 400;
        throw error;
      }
      const verifiedUser = await usersStore.update(user.id, {
        is_verified: true,
        otp_code: null,
        updated_at: new Date().toISOString(),
      });
      setAuthForUser(verifiedUser);
      return { access_token: localStorage.getItem(authTokenKey), user: verifiedUser };
    },

    resendOtp: async (email) => {
      const normalized = normalizeEmail(email);
      const users = await usersStore.filter({ email: normalized });
      const user = users[0];
      if (!user) {
        return { message: 'Se existir, enviaremos um novo código de verificação.' };
      }
      if (user.is_verified) {
        return { message: 'Conta já verificada.' };
      }
      await usersStore.update(user.id, {
        otp_code: '123456',
        updated_at: new Date().toISOString(),
      });
      return { message: 'Código reenviado.' };
    },

    resetPasswordRequest: async (email) => {
      const normalized = normalizeEmail(email);
      const users = await usersStore.filter({ email: normalized });
      const user = users[0];
      if (!user) {
        return { message: 'Se existir uma conta com esse email, você receberá um link em breve.' };
      }
      const resetToken = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      await usersStore.update(user.id, {
        reset_token: resetToken,
        reset_token_expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        updated_at: new Date().toISOString(),
      });
      return { message: 'Se existir uma conta com esse email, você receberá um link em breve.' };
    },

    resetPassword: async ({ resetToken, newPassword }) => {
      if (!resetToken) {
        const error = new Error('Token de redefinição ausente');
        error.status = 400;
        throw error;
      }
      const allUsers = await usersStore.list();
      const user = allUsers.find((item) => item.reset_token === resetToken);
      if (!user) {
        const error = new Error('Token de redefinição inválido');
        error.status = 400;
        throw error;
      }
      if (user.reset_token_expires_at && new Date(user.reset_token_expires_at) < new Date()) {
        const error = new Error('Token de redefinição expirado');
        error.status = 400;
        throw error;
      }
      const updatedUser = await usersStore.update(user.id, {
        password: String(newPassword),
        reset_token: null,
        reset_token_expires_at: null,
        updated_at: new Date().toISOString(),
      });
      setAuthForUser(updatedUser);
      return { access_token: localStorage.getItem(authTokenKey), user: updatedUser };
    },

    logout: async (redirectUrl) => {
      clearAuth();
      if (typeof window !== 'undefined' && redirectUrl) {
        window.location.href = redirectUrl;
      }
      return true;
    },

    setToken: async (token) => {
      localStorage.setItem(authTokenKey, token);
      return token;
    },

    redirectToLogin: async (redirectUrl = '/login') => {
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      }
    },
  },

  entities: {
    Equipment: equipmentStore,
    Maintenance: maintenanceStore,
    CentroDeCusto: centroDeCustoStore,
    InfrastructureMaintenance: infrastructureMaintenanceStore,
    Fornecedor: fornecedorStore,
    Material: materialStore,
    Gasto: gastoStore,
    GastoItem: gastoItemStore,
  },

  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        if (!file) {
          const error = new Error('Arquivo não informado');
          error.status = 400;
          throw error;
        }
        return { file_url: URL.createObjectURL(file) };
      },
    },
  },
};