import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from '@/components/ui/DataTable';

describe('DataTable Component', () => {
  const columns = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'role', header: 'Role' },
  ];

  const data = [
    { id: 1, name: 'Alice', role: 'Admin' },
    { id: 2, name: 'Bob', role: 'Student' },
  ];

  it('renders columns and rows properly', () => {
    render(<DataTable columns={columns} data={data} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it('shows empty state when data is empty and not loading', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No records found"
      />
    );

    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('triggers onSort when clicking a sortable column', () => {
    const handleSort = vi.fn();
    render(<DataTable columns={columns} data={data} onSort={handleSort} />);

    fireEvent.click(screen.getByText('Name'));
    expect(handleSort).toHaveBeenCalledWith('name');
  });
});
