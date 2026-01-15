import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => mockUseAuth(),
}));

// Mock AuthLoadingScreen
vi.mock('@/components/auth/AuthLoadingScreen', () => ({
    AuthLoadingScreen: () => <div data-testid="loading-screen">Loading...</div>,
}));

// Mock Navigate
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        Navigate: ({ to }: { to: string }) => <div data-testid="redirect">Redirecting to {to}</div>,
    };
});

// Mock lucide-react
vi.mock('lucide-react', () => ({
    AlertCircle: () => <span>⚠️</span>,
}));

// Import after mocks
import ProtectedRoute from '@/components/ProtectedRoute';

describe('ProtectedRoute - Auth Hydration Guard Regression Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * REGRESSION TEST 1: Show spinner when sessionState is 'unknown'
     * 
     * This was part of the "Access Denied" bug - we were rendering children
     * before session validation completed.
     */
    it('TEST 1: Should show loading screen when sessionState is unknown', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            appUser: null,
            loading: true,
            sessionState: 'unknown',
        });

        render(
            <MemoryRouter>
                <ProtectedRoute requiredRole="admin">
                    <div>Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    /**
     * REGRESSION TEST 2: Show spinner when sessionState is 'validating'
     * 
     * Critical: During F5 refresh, sessionState starts as 'validating'.
     * We must NOT render children until validation completes.
     */
    it('TEST 2: Should show loading screen when sessionState is validating', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            appUser: null,
            loading: true,
            sessionState: 'validating',
        });

        render(
            <MemoryRouter>
                <ProtectedRoute requiredRole="admin">
                    <div>Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    /**
     * REGRESSION TEST 3: Show spinner when user exists but appUser is still loading
     * 
     * This was the CRITICAL bug: even after user was confirmed, appUser takes
     * additional time to fetch. Children would crash accessing appUser.role.
     */
    it('TEST 3: Should show loading screen when user exists but appUser is null', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'test-user' },
            appUser: null, // appUser not yet loaded!
            loading: false,
            sessionState: 'active',
        });

        render(
            <MemoryRouter>
                <ProtectedRoute requiredRole="admin">
                    <div>Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    /**
     * REGRESSION TEST 4: Render children only when BOTH user AND appUser exist
     */
    it('TEST 4: Should render children when user AND appUser are fully loaded', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'test-user' },
            appUser: { id: 'test-user', role: 'admin', is_active: true },
            loading: false,
            sessionState: 'active',
        });

        render(
            <MemoryRouter>
                <ProtectedRoute requiredRole="admin">
                    <div>Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    /**
     * REGRESSION TEST 5: Redirect to login only when session is explicitly expired
     */
    it('TEST 5: Should redirect to login when session is expired and no user', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            appUser: null,
            loading: false,
            sessionState: 'expired',
        });

        render(
            <MemoryRouter initialEntries={['/dashboard/admin']}>
                <ProtectedRoute requiredRole="admin">
                    <div>Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByTestId('redirect')).toBeInTheDocument();
        expect(screen.getByText(/Redirecting to.*login/)).toBeInTheDocument();
    });
});
