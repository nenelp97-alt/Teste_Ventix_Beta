import React from 'react';
import { FileText, Users, Settings, ArrowRight } from 'lucide-react';
import ventixLogo from '../assets/ventix-logo.png';

export default function PainelPrincipal({ onSelectModule }) {
  const modulos = [
    {
      id: 'sucatas',
      titulo: 'Vendas de Sucatas',
      descricao: 'Gerencie registros, notas fiscais, relatórios e importações de planilhas.',
      icone: FileText,
      corBadge: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      id: 'clientes',
      titulo: 'Clientes e Fornecedores',
      descricao: 'Cadastro completo de parceiros, empresas e contatos comerciais.',
      icone: Users,
      corBadge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      id: 'configuracoes',
      titulo: 'Configurações do Sistema',
      descricao: 'Parâmetros gerais, preferências e ajustes da aplicação.',
      icone: Settings,
      corBadge: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-6 sm:p-10 overflow-hidden font-mono">
      
      {/* 1. Imagem de Fundo importada de src/assets */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 filter brightness-[0.85]"
        style={{ backgroundImage: `url(${ventixLogo})` }}
      />
      
      {/* Camada translúcida escura sobre a imagem para destacar os cards */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[3px] z-0" />

      {/* 2. Cabeçalho do Painel */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h1 className="text-xl font-bold tracking-wider text-white uppercase">Painel Principal</h1>
          </div>
          <p className="text-xs text-slate-400">Selecione o módulo operacional desejado para iniciar.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
          <div className="text-right">
            <div className="text-xs font-bold text-white">Ventix System</div>
            <div className="text-[10px] text-blue-400">Ambiente Operacional</div>
          </div>
        </div>
      </div>

      {/* 3. Grade de Módulos (Cards Interativos) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-auto py-8">
        {modulos.map((modulo) => {
          const IconeComponente = modulo.icone;
          return (
            <div 
              key={modulo.id}
              onClick={() => onSelectModule && onSelectModule(modulo.id)}
              className="group relative bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-300 shadow-xl backdrop-blur-md cursor-pointer flex flex-col justify-between space-y-6 overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 group-hover:scale-110 transition-transform">
                    <IconeComponente className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase ${modulo.corBadge}`}>
                    Ativo
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    {modulo.titulo}
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {modulo.descricao}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 group-hover:text-white transition-colors relative z-10">
                <span className="font-medium">Acessar módulo</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-blue-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Rodapé */}
      <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <div>Ventix System — Todos os direitos reservados.</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Sistema Conectado com Sucesso</span>
        </div>
      </div>

    </div>
  );
}