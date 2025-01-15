import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function loginUser(username: string, password: string) {
  try {
    console.log('Attempting login for user:', username) // Debug-Log

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error) {
      console.error('Supabase error:', error) // Debug-Log
      return { error: 'Benutzer nicht gefunden' }
    }

    if (!user) {
      console.log('No user found') // Debug-Log
      return { error: 'Benutzer nicht gefunden' }
    }

    console.log('User found, checking password') // Debug-Log

    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      console.log('Password does not match') // Debug-Log
      return { error: 'Ungültiges Passwort' }
    }

    console.log('Login successful') // Debug-Log
    return { user }
  } catch (error) {
    console.error('Login error:', error) // Debug-Log
    return { error: 'Ein Fehler ist aufgetreten' }
  }
}

export async function createUser(username: string, password: string) {
  try {
    // Prüfen ob Benutzer bereits existiert
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUser) {
      return { error: 'Benutzername bereits vergeben' }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        { 
          username,
          password_hash: hashedPassword
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Create user error:', error)
      return { error: error.message }
    }

    return { user }
  } catch (error) {
    console.error('Create user error:', error)
    return { error: 'Ein Fehler ist aufgetreten' }
  }
}

export async function updateUserPassword(username: string, newPassword: string) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    const { error } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('username', username)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: 'Ein Fehler ist aufgetreten' }
  }
}

export async function deleteUser(username: string) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('username', username)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: 'Ein Fehler ist aufgetreten' }
  }
}

export async function getAllUsers() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('username, created_at')

    if (error) {
      return { error: error.message }
    }

    return { users }
  } catch (error) {
    return { error: 'Ein Fehler ist aufgetreten' }
  }
} 