import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  dot = false,
}) => {
  const variantStyles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200/80',
    red: 'bg-rose-50 text-rose-700 border-rose-200/80',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const dotColors = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-rose-500',
    blue: 'bg-blue-500',
    purple: 'bg-indigo-500',
    gray: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} transition-colors`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  );
};

export const StockBadge: React.FC<{ status: 'In Stock' | 'Low Stock' | 'Out of Stock' | string }> = ({ status }) => {
  if (status === 'In Stock') {
    return <Badge variant="green" dot>In Stock</Badge>;
  }
  if (status === 'Low Stock') {
    return <Badge variant="yellow" dot>Low Stock</Badge>;
  }
  return <Badge variant="red" dot>Out of Stock</Badge>;
};

export const POBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Received':
      return <Badge variant="green" dot>Received</Badge>;
    case 'Approved':
      return <Badge variant="blue" dot>Approved</Badge>;
    case 'Ordered':
      return <Badge variant="purple" dot>Ordered</Badge>;
    case 'Pending Approval':
      return <Badge variant="yellow" dot>Pending Approval</Badge>;
    case 'Rejected':
      return <Badge variant="red" dot>Rejected</Badge>;
    case 'Draft':
    default:
      return <Badge variant="gray" dot>Draft</Badge>;
  }
};
