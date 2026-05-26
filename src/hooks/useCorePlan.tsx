
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface CorePlan {
    id: string;
    content: string;
    updated_at: string;
    updated_by: string;
}

export function useCorePlan() {
    const [plan, setPlan] = useState<CorePlan | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchPlan = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('core_plan')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                throw error;
            }

            setPlan(data || null);
        } catch (error: any) {
            console.error('Error fetching core plan:', error);
            toast({
                title: "Error fetching plan",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const updatePlan = async (content: string, username: string) => {
        try {
            setLoading(true);

            let error;
            if (plan?.id) {
                const { error: updateError } = await supabase
                    .from('core_plan')
                    .update({ content, updated_by: username, updated_at: new Date().toISOString() })
                    .eq('id', plan.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('core_plan')
                    .insert({ content, updated_by: username });
                error = insertError;
            }

            if (error) throw error;

            toast({
                title: "Plan updated",
                description: "The core plan has been successfully updated."
            });

            await fetchPlan();
            return true;
        } catch (error: any) {
            console.error('Error updating core plan:', error);
            toast({
                title: "Update failed",
                description: error.message,
                variant: "destructive"
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlan();
    }, []);

    return { plan, loading, fetchPlan, updatePlan };
}
