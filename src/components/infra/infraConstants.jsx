export const categoryLabels = {
  electrical: 'Elétrica',
  plumbing: 'Hidráulica',
  civil: 'Civil',
  painting: 'Pintura',
  structural: 'Estrutural',
  furniture: 'Mobiliário',
  security: 'Segurança',
  other: 'Outros'
};

export const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
};

export const statusLabels = {
  scheduled: 'Agendada',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada'
};

export const statusColors = {
  scheduled: 'bg-primary/10 text-primary border-primary/20',
  in_progress: 'bg-accent/10 text-accent border-accent/20',
  completed: 'bg-secondary/10 text-secondary border-secondary/20',
  cancelled: 'bg-muted text-muted-foreground border-border'
};

export const priorityColors = {
  low: 'bg-muted text-muted-foreground border-border',
  medium: 'bg-primary/10 text-primary border-primary/20',
  high: 'bg-secondary/10 text-secondary border-secondary/20',
  urgent: 'bg-destructive/10 text-destructive border-destructive/20'
};

export const CHART_COLORS = [
  'hsl(var(--foreground))', 'hsl(var(--foreground))', 'hsl(var(--foreground))',
  'hsl(var(--foreground))', 'hsl(var(--foreground))', 'hsl(var(--foreground))', 'hsl(var(--foreground))', 'hsl(var(--foreground))'
];

export const fmt = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });