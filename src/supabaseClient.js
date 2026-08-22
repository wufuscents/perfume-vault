import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjooywttnxvswdlziws.supabase.co'
const supabaseAnonKey = 'sb_publishable_h_PV-Lcm0fKwZNKHKaXtag_x-x2GOOU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
