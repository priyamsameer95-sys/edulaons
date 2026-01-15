
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
                })),
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
            update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
            delete: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
                in: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
        })),
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })),
        },
    },
}));

// Mock hooks
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

vi.mock('@/hooks/useAuditLog', () => ({
    useAuditLog: () => ({
        logFieldChanges: vi.fn(),
    }),
}));

vi.mock('@/hooks/useLenderRecommendationTrigger', () => ({
    useLenderRecommendationTrigger: () => ({
        triggerRecommendation: vi.fn(),
    }),
    shouldTriggerRecommendation: vi.fn(() => false),
    RECOMMENDATION_TRIGGER_FIELDS: [],
}));

describe('Admin Module - Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('AdminErrorBoundary', () => {
        it('exports correctly', async () => {
            const { AdminErrorBoundary } = await import('@/components/admin/AdminErrorBoundary');
            expect(AdminErrorBoundary).toBeDefined();
        });

        it('renders children when no error', async () => {
            const { AdminErrorBoundary } = await import('@/components/admin/AdminErrorBoundary');
            render(
                <AdminErrorBoundary>
                    <div data-testid="child">Content</div>
                </AdminErrorBoundary>
            );
            expect(screen.getByTestId('child')).toBeInTheDocument();
        });
    });
});

describe('Admin Module - Integration Tests', () => {
    describe('CollapsibleModal Integration', () => {
        it('CollapsibleModal renders with title as string', async () => {
            const { CollapsibleModal } = await import('@/components/common/collapsible-modal');
            render(
                <CollapsibleModal
                    open={true}
                    onOpenChange={() => { }}
                    title="Test Modal"
                    description="Test Description"
                >
                    <div>Content</div>
                </CollapsibleModal>
            );
            expect(screen.getByText('Test Modal')).toBeInTheDocument();
        });

        it('CollapsibleModal renders with title as JSX', async () => {
            const { CollapsibleModal } = await import('@/components/common/collapsible-modal');
            render(
                <CollapsibleModal
                    open={true}
                    onOpenChange={() => { }}
                    title={<span data-testid="jsx-title">JSX Title</span>}
                >
                    <div>Content</div>
                </CollapsibleModal>
            );
            expect(screen.getByTestId('jsx-title')).toBeInTheDocument();
        });

        it('CollapsibleSection expands and collapses', async () => {
            const { CollapsibleSection } = await import('@/components/common/collapsible-modal');
            render(
                <CollapsibleSection title="Expandable Section">
                    <div data-testid="content">Hidden Content</div>
                </CollapsibleSection>
            );

            // Initially collapsed
            expect(screen.queryByTestId('content')).not.toBeInTheDocument();

            // Click to expand
            fireEvent.click(screen.getByText('Expandable Section'));
            expect(screen.getByTestId('content')).toBeInTheDocument();

            // Click to collapse
            fireEvent.click(screen.getByText('Expandable Section'));
            expect(screen.queryByTestId('content')).not.toBeInTheDocument();
        });

        it('CollapsibleSection shows rightElement badge', async () => {
            const { CollapsibleSection } = await import('@/components/common/collapsible-modal');
            render(
                <CollapsibleSection
                    title="Section with Badge"
                    rightElement={<span data-testid="badge">Modified</span>}
                >
                    <div>Content</div>
                </CollapsibleSection>
            );
            expect(screen.getByTestId('badge')).toBeInTheDocument();
        });
    });
});

describe('Admin Module - Edit Tab Tests', () => {
    describe('EditAdminTab', () => {
        it('exports correctly', async () => {
            const { EditAdminTab } = await import('@/components/admin/lead-edit/EditAdminTab');
            expect(EditAdminTab).toBeDefined();
        });

        it('renders with adminNotes prop', async () => {
            const { EditAdminTab } = await import('@/components/admin/lead-edit/EditAdminTab');
            const handleChange = vi.fn();
            render(
                <EditAdminTab adminNotes="Test notes" handleInputChange={handleChange} />
            );
            expect(screen.getByText('Internal Notes')).toBeInTheDocument();
        });
    });
});
