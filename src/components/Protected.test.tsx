import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { Protected } from './Protected';

const mockUseAuth = vi.fn();
const mockUseAuthorization = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));
vi.mock('@/hooks/useAuthorization', () => ({
  useAuthorization: () => mockUseAuthorization(),
}));
vi.mock('react-router-dom', async () => {
  const actual: any = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Protected component', () => {
  it('renders children when access is allowed', () => {
    mockUseAuth.mockReturnValue({ session: {}, loading: false });
    mockUseAuthorization.mockReturnValue({ profile: { role: 'adminfilial', panels: ['dashboard'] }, loading: false });

    render(
      <MemoryRouter
        initialEntries={['/']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Protected allowedRoles={['adminfilial']} panelKey="dashboard">
          <div>Allowed</div>
        </Protected>
      </MemoryRouter>
    );

    expect(screen.getByText('Allowed')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('allows superadmin even when not explicitly allowed', () => {
    mockUseAuth.mockReturnValue({ session: {}, loading: false });
    mockUseAuthorization.mockReturnValue({ profile: { role: 'superadmin', panels: [] }, loading: false });

    render(
      <MemoryRouter
        initialEntries={['/']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Protected allowedRoles={['adminfilial']}>
          <div>Super Allowed</div>
        </Protected>
      </MemoryRouter>
    );

    expect(screen.getByText('Super Allowed')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirects when role is denied', async () => {
    mockUseAuth.mockReturnValue({ session: {}, loading: false });
    mockUseAuthorization.mockReturnValue({ profile: { role: 'user', panels: [] }, loading: false });

    render(
      <MemoryRouter
        initialEntries={['/']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Protected allowedRoles={['adminfilial']}>
          <div>Denied</div>
        </Protected>
      </MemoryRouter>
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));
    expect(mockNavigate).toHaveBeenCalledWith('/acesso-negado', { replace: true });
  });
});
