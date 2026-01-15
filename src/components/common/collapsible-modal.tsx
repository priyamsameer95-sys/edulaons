import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    rightElement?: React.ReactNode;
}

export function CollapsibleSection({ title, children, defaultOpen = false, rightElement }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border rounded-lg bg-white overflow-hidden mb-3 shadow-sm">
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    {rightElement}
                </div>
            </div>

            {isOpen && (
                <div className="p-4 pt-0 border-t">
                    <div className="pt-4">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}

interface CollapsibleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export function CollapsibleModal({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    className
}: CollapsibleModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 gap-0", className)}>
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="text-xl font-bold text-primary">{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 bg-gray-50/50">
                    <div className="space-y-1">
                        {children}
                    </div>
                </ScrollArea>

                {footer && (
                    <div className="p-4 border-t bg-white flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
