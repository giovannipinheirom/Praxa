-- Remove old policy
DROP POLICY IF EXISTS "Users can insert their own demandas." ON public.demandas;

-- Create new policy that only allows authenticated users to insert their own demands
-- Anonymous demands must go through the secure server function using supabaseAdmin
CREATE POLICY "Users can insert their own demandas." 
ON public.demandas 
FOR INSERT 
WITH CHECK (auth.uid() = cliente_profile_id);
