import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ggpidhdqlypagxivlucw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncGlkaGRxbHlwYWd4aXZsdWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NzM3NDgsImV4cCI6MjEwNDQ0OTc0OH0.SmxkQb2RLIEKPRV-Mh5F8nSDN4XNUTbOK7U77SWq7XM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
