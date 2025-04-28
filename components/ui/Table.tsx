'use client';

import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`table ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }: TableProps) {
  return (
    <thead className={`table-header ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }: TableProps) {
  return (
    <tbody className={`table-body ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '' }: TableProps) {
  return (
    <tr className={`table-row ${className}`}>
      {children}
    </tr>
  );
}

export function TableHeaderCell({ children, className = '' }: TableProps) {
  return (
    <th className={`table-header-cell ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }: TableProps) {
  return (
    <td className={`table-cell ${className}`}>
      {children}
    </td>
  );
}
