import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Mock users for now since we don't have a users API
const MOCK_USERS = [
    { id: 'u1', name: 'John Doe', email: 'john@example.com', role: 'ceo_admin' },
    { id: 'u2', name: 'Jane Smith', email: 'jane@example.com', role: 'warehouse_admin' },
    { id: 'u3', name: 'Bob Wilson', email: 'bob@example.com', role: 'onsite_team' },
    { id: 'u4', name: 'Alice Brown', email: 'alice@example.com', role: 'onsite_team' },
];

const assignSchema = z.object({
    user_id: z.string().min(1, 'User is required'),
});

interface AssignTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

export const AssignTeamModal = ({ isOpen, onClose, projectId }: AssignTeamModalProps) => {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof assignSchema>>({
        resolver: zodResolver(assignSchema),
        defaultValues: {
            user_id: '',
        },
    });

    const assignMutation = useMutation({
        mutationFn: api.userProjects.assign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
            onClose();
            form.reset();
            toast.success('Team member assigned successfully');
        },
        onError: (error) => {
            console.error(error);
            toast.error('Failed to assign team member');
        },
    });

    const onSubmit = (values: z.infer<typeof assignSchema>) => {
        assignMutation.mutate({
            project_id: projectId,
            user_id: values.user_id,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Team Member</DialogTitle>
                    <DialogDescription>
                        Add a user to this project and define their role.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="user_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>User</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a user" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {MOCK_USERS.map((user) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.name} ({user.role})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />



                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={assignMutation.isPending}>
                                {assignMutation.isPending ? 'Assigning...' : 'Assign Member'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
