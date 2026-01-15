
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleSection, CollapsibleModal } from '../components/common/collapsible-modal';

describe('CollapsibleSection', () => {
    it('renders title correctly', () => {
        render(
            <CollapsibleSection title="Test Section">
                <p>Content</p>
            </CollapsibleSection>
        );
        expect(screen.getByText('Test Section')).toBeInTheDocument();
    });

    it('is collapsed by default', () => {
        render(
            <CollapsibleSection title="Test Section">
                <p>Hidden Content</p>
            </CollapsibleSection>
        );
        expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
    });

    it('expands when defaultOpen is true', () => {
        render(
            <CollapsibleSection title="Test Section" defaultOpen={true}>
                <p>Visible Content</p>
            </CollapsibleSection>
        );
        expect(screen.getByText('Visible Content')).toBeInTheDocument();
    });

    it('toggles content on click', () => {
        render(
            <CollapsibleSection title="Toggle Section">
                <p>Toggle Content</p>
            </CollapsibleSection>
        );

        // Initially collapsed
        expect(screen.queryByText('Toggle Content')).not.toBeInTheDocument();

        // Click to expand
        fireEvent.click(screen.getByText('Toggle Section'));
        expect(screen.getByText('Toggle Content')).toBeInTheDocument();

        // Click to collapse
        fireEvent.click(screen.getByText('Toggle Section'));
        expect(screen.queryByText('Toggle Content')).not.toBeInTheDocument();
    });

    it('renders rightElement when provided', () => {
        render(
            <CollapsibleSection
                title="Test Section"
                rightElement={<span data-testid="badge">Badge</span>}
            >
                <p>Content</p>
            </CollapsibleSection>
        );
        expect(screen.getByTestId('badge')).toBeInTheDocument();
    });
});

describe('CollapsibleModal', () => {
    it('renders title and description', () => {
        render(
            <CollapsibleModal
                open={true}
                onOpenChange={() => { }}
                title="Modal Title"
                description="Modal Description"
            >
                <p>Modal Content</p>
            </CollapsibleModal>
        );
        expect(screen.getByText('Modal Title')).toBeInTheDocument();
        expect(screen.getByText('Modal Description')).toBeInTheDocument();
    });

    it('renders children content', () => {
        render(
            <CollapsibleModal
                open={true}
                onOpenChange={() => { }}
                title="Title"
            >
                <p>Child Content</p>
            </CollapsibleModal>
        );
        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('renders footer when provided', () => {
        render(
            <CollapsibleModal
                open={true}
                onOpenChange={() => { }}
                title="Title"
                footer={<button>Save</button>}
            >
                <p>Content</p>
            </CollapsibleModal>
        );
        expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(
            <CollapsibleModal
                open={false}
                onOpenChange={() => { }}
                title="Hidden Title"
            >
                <p>Hidden Content</p>
            </CollapsibleModal>
        );
        expect(screen.queryByText('Hidden Title')).not.toBeInTheDocument();
    });

    it('accepts JSX as title', () => {
        render(
            <CollapsibleModal
                open={true}
                onOpenChange={() => { }}
                title={<span data-testid="jsx-title">JSX Title</span>}
            >
                <p>Content</p>
            </CollapsibleModal>
        );
        expect(screen.getByTestId('jsx-title')).toBeInTheDocument();
    });
});
