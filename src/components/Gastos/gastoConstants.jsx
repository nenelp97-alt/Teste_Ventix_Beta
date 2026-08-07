export const moduloLabels = {
  infraestrutura: 'Infraestrutura',
  ar_condicionado: 'Ar-Condicionado'
};

export const tipoLabels = {
  material: 'Material',
  servico: 'Serviço',
  peca: 'Peça',
  contrato: 'Contrato',
  outros: 'Outros'
};

export const categoriaLabels = {
  electrical: 'Elétrica',
  plumbing: 'Hidráulica',
  civil: 'Civil',
  painting: 'Pintura',
  structural: 'Estrutural',
  furniture: 'Mobiliário',
  security: 'Segurança',
  climatizacao: 'Climatização',
  other: 'Outros'
};

export const origemLabels = {
  MANUAL: 'Manual',
  NF: 'Nota Fiscal'
};

export const origemColors = {
  MANUAL: 'bg-muted text-muted-foreground border-border',
  NF: 'bg-secondary/10 text-secondary border-secondary/20'
};

export const fmt = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const normalizeCnpj = (cnpj) => (cnpj || '').replace(/\D/g, '');

export const formatCnpj = (cnpj) => {
  const d = normalizeCnpj(cnpj);
  if (d.length !== 14) return cnpj || '';
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};