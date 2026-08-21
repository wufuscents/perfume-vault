import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjooywttnxvswdlziws.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqb295d3R0d254dnN3ZGx6aXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTI5MDksImV4cCI6MjEwMjg4ODkwOX0.Ghlc9rVrfHsq0UKaIbd4kpAQuTRpqrzTmdpOGerdUmk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
