import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

import imgSucatas from '../assets/sucatas-bg.jpg';
import imgManutencao from '../assets/manutencao-bg.jpg';
import imgInfra from '../assets/infra-bg.jpg';

const backgroundImages = [imgSucatas, imgManutencao, imgInfra];

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth() || {};
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const cleanUser = username.trim();
    const isMaster = cleanUser.toLowerCase() === 'master01' || cleanUser.toLowerCase() === 'admin02';

    let existingUsers = JSON.parse(localStorage.getItem('ventix_users_list') || '[]');
    
    // Garante que o Master01 mestre do criador exista com a senha correta e aprovado
    const userIndex = existingUsers.findIndex(u => u.username.toLowerCase() === 'master01');
    if (userIndex >= 0) {
      existingUsers[userIndex].role = 'Master';
      existingUsers[userIndex].approved = true;
      existingUsers[userIndex].password = 'Er9fizwz@'; // Senha fixa do criador
    } else {
      existingUsers.unshift({ 
        username: 'Master01', 
        password: 'Er9fizwz@', 
        role: 'Master',
        approved: true
      });
    }
    localStorage.setItem('ventix_users_list', JSON.stringify(existingUsers));

    // Validação de login para o Master01
    if (isMaster) {
      if (cleanUser.toLowerCase() === 'master01' && password !== 'Er9fizwz@') {
        alert('Senha incorreta para o usuário Master do criador.');
        return;
      }
    } else {
      // Validação para contas comuns
      const foundUser = existingUsers.find(u => u.username.toLowerCase() === cleanUser.toLowerCase());
      
      if (!foundUser) {
        alert('Usuário não encontrado. Realize o cadastro primeiro.');
        return;
      }
      
      if (foundUser.password !== password) {
        alert('Senha incorreta.');
        return;
      }

      if (!foundUser.approved) {
        alert('Acesso negado: Seu cadastro ainda aguarda aprovação do Administrador Master01.');
        return;
      }
    }

    localStorage.setItem('ventix_user', cleanUser);

    try {
      if (login) {
        await login({ username: cleanUser, password });
      }
    } catch (err) {
      console.log('Login state sync:', err);
    }

    window.location.href = '/';
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden font-mono bg-slate-950">
      {backgroundImages.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out z-0 ${
            index === currentImageIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
          }`}
          style={{ 
            backgroundImage: `url(${img})`,
            transition: 'opacity 1.5s ease-in-out, transform 7s ease-out' 
          }}
        />
      ))}
      
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] z-0" />

      <div className="relative z-10 w-full max-w-md bg-slate-900/40 border border-white/20 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-wider mb-2 drop-shadow-md">VENTIX</h1>
          <p className="text-slate-300 text-xs uppercase tracking-widest drop-shadow">
            Gestão Integrada de Ativos
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-slate-200 text-xs uppercase tracking-wider block mb-2 font-semibold">Usuário</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-300" />
              <Input 
                type="text" 
                placeholder="Ex: Master01" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-950/40 border-white/20 text-white placeholder:text-slate-400 pl-10 h-11 focus:border-emerald-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-slate-200 text-xs uppercase tracking-wider block mb-2 font-semibold">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-300" />
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-950/40 border-white/20 text-white placeholder:text-slate-400 pl-10 h-11 focus:border-emerald-400"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 px-1 pt-1">
            <button type="button" onClick={() => navigate('/forgot-password')} className="hover:text-emerald-400 transition-colors">
              Esqueci senha
            </button>
            <button type="button" onClick={() => navigate('/register')} className="hover:text-emerald-400 transition-colors">
              Realizar cadastro
            </button>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-emerald-600/90 hover:bg-emerald-500 text-white h-11 font-bold tracking-wide transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 border border-emerald-400/30 mt-2"
          >
            Entrar no Sistema <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="flex justify-center items-center gap-2 mt-6">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentImageIndex ? 'w-6 bg-emerald-400 shadow-md shadow-emerald-400/50' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}