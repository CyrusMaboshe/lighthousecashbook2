
import { supabase } from "@/integrations/supabase/client";

export interface StudioDocument {
    id: string;
    title: string;
    type: 'editor' | 'file';
    content: any;
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    author_id: string;
    created_at: string;
    updated_at: string;
}

export const studioDocumentsService = {
    async getAll(): Promise<StudioDocument[]> {
        const { data, error } = await supabase
            .from('studio_documents')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async create(doc: Omit<StudioDocument, 'id' | 'created_at' | 'updated_at'>): Promise<StudioDocument> {
        const { data, error } = await supabase
            .from('studio_documents')
            .insert(doc)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<StudioDocument>): Promise<StudioDocument> {
        const { data, error } = await supabase
            .from('studio_documents')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('studio_documents')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async uploadFile(file: File): Promise<{ publicUrl: string; fileName: string; fileSize: number }> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('studio-documents')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('studio-documents')
            .getPublicUrl(filePath);

        return {
            publicUrl: data.publicUrl,
            fileName: file.name,
            fileSize: file.size
        };
    }
};
