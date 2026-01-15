import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock dependencies
vi.mock('@/components/ui/button', () => ({
    Button: ({ children, disabled, ...props }: any) => (
        <button disabled={disabled} {...props}>{children}</button>
    ),
}));

vi.mock('@/components/ui/command', () => ({
    Command: ({ children }: any) => <div data-testid="command">{children}</div>,
    CommandEmpty: ({ children }: any) => <div>{children}</div>,
    CommandGroup: ({ children, heading }: any) => <div data-testid={`group-${heading}`}>{children}</div>,
    CommandInput: ({ value, onValueChange, ...props }: any) => (
        <input value={value} onChange={(e) => onValueChange?.(e.target.value)} {...props} />
    ),
    CommandItem: ({ children, onSelect, value }: any) => (
        <div data-testid={`item-${value}`} onClick={() => onSelect?.(value)}>{children}</div>
    ),
    CommandList: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/popover', () => ({
    Popover: ({ children, open }: any) => <div data-state={open ? 'open' : 'closed'}>{children}</div>,
    PopoverTrigger: ({ children, asChild }: any) => <div data-testid="trigger">{children}</div>,
    PopoverContent: ({ children }: any) => <div data-testid="content">{children}</div>,
}));

vi.mock('lucide-react', () => ({
    Check: () => <span>✓</span>,
    ChevronsUpDown: () => <span>↕</span>,
    X: () => <span>✗</span>,
}));

vi.mock('@/lib/utils', () => ({
    cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Import after mocks
import { PartnerCombobox, PartnerOption } from '@/components/ui/partner-combobox';

describe('PartnerCombobox - Regression Tests', () => {
    const mockPartners: PartnerOption[] = [
        { id: '1', name: 'Partner One', partner_code: 'P001' },
        { id: '2', name: 'Partner Two', partner_code: 'P002' },
        { id: '3', name: 'Partner Three', partner_code: 'P003' },
    ];

    const defaultProps = {
        partners: mockPartners,
        value: null,
        onChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    /**
     * TEST CASE 1: Partners undefined should not crash
     * 
     * This was the root cause of the "Cannot read properties of undefined (reading 'length')" error.
     * When the modal opens before the partners API completes, partners is undefined.
     */
    it('TEST 1: should NOT crash when partners is undefined', () => {
        // This should NOT throw an error
        expect(() => {
            render(
                <PartnerCombobox
                    partners={undefined as any}
                    value={null}
                    onChange={vi.fn()}
                />
            );
        }).not.toThrow();
    });

    /**
     * TEST CASE 2: Shows loading state when partners is undefined
     */
    it('TEST 2: should show "Loading partners..." when partners is undefined', () => {
        render(
            <PartnerCombobox
                partners={undefined as any}
                value={null}
                onChange={vi.fn()}
            />
        );

        expect(screen.getByText('Loading partners...')).toBeInTheDocument();
    });

    /**
     * TEST CASE 3: Button is disabled when loading
     */
    it('TEST 3: should disable button when partners is undefined', () => {
        render(
            <PartnerCombobox
                partners={undefined as any}
                value={null}
                onChange={vi.fn()}
            />
        );

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    /**
     * TEST CASE 4: Partners null should not crash
     */
    it('TEST 4: should NOT crash when partners is null', () => {
        expect(() => {
            render(
                <PartnerCombobox
                    partners={null as any}
                    value={null}
                    onChange={vi.fn()}
                />
            );
        }).not.toThrow();
    });

    /**
     * TEST CASE 5: Empty array should work correctly
     */
    it('TEST 5: should work correctly with empty partners array', () => {
        expect(() => {
            render(
                <PartnerCombobox
                    partners={[]}
                    value={null}
                    onChange={vi.fn()}
                />
            );
        }).not.toThrow();

        // Should show placeholder, not loading
        expect(screen.queryByText('Loading partners...')).not.toBeInTheDocument();
    });

    /**
     * TEST CASE 6: Normal rendering with valid partners
     */
    it('TEST 6: should render correctly with valid partners array', () => {
        render(
            <PartnerCombobox
                partners={mockPartners}
                value={null}
                onChange={vi.fn()}
            />
        );

        // Button should be enabled
        const button = screen.getByRole('button');
        expect(button).not.toBeDisabled();
        expect(screen.queryByText('Loading partners...')).not.toBeInTheDocument();
    });

    /**
     * TEST CASE 7: Selected partner displays correctly
     */
    it('TEST 7: should display selected partner name when value is set', () => {
        render(
            <PartnerCombobox
                partners={mockPartners}
                value="1"
                onChange={vi.fn()}
            />
        );

        expect(screen.getByText('Partner One')).toBeInTheDocument();
        expect(screen.getByText('(P001)')).toBeInTheDocument();
    });
});

describe('Add Lead Modal Initialization - Regression Tests', () => {
    /**
     * These tests ensure the Add Lead modal never crashes on initialization
     */

    it('TEST 8: Modal should handle partners prop transitioning from undefined to array', () => {
        const { rerender } = render(
            <PartnerCombobox
                partners={undefined as any}
                value={null}
                onChange={vi.fn()}
            />
        );

        expect(screen.getByText('Loading partners...')).toBeInTheDocument();

        // Rerender with actual partners (simulating API completing)
        rerender(
            <PartnerCombobox
                partners={[{ id: '1', name: 'Test Partner', partner_code: 'TP001' }]}
                value={null}
                onChange={vi.fn()}
            />
        );

        // Should no longer show loading
        expect(screen.queryByText('Loading partners...')).not.toBeInTheDocument();
        // Button should be enabled
        expect(screen.getByRole('button')).not.toBeDisabled();
    });
});
