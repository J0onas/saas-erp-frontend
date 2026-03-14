'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('gerente@techsolutions.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // ¡Aquí ocurre la magia dinámica en la nube!
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        // --- FIX BUG #5: PERMITIR COOKIES CROSS-DOMAIN ---
        credentials: 'include', 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }
      // Guardamos un indicador de que estamos logueados y los datos inofensivos del usuario
      localStorage.setItem('isLoggedIn', 'true');
      if (data.user) {
         localStorage.setItem('user_data', JSON.stringify(data.user));
      }
      
      alert('¡Login exitoso! Entrando al sistema...');
      router.push('/dashboard'); 
      // ¡LA SEGURIDAD EN ACCIÓN! 
      // Ya NO usamos localStorage.setItem('saas_token', ...).
      // El navegador acaba de guardar la cookie httpOnly automáticamente en su bóveda.
      
      // Opcional: Si necesitas los datos del usuario (nombre, rol) para mostrar en pantalla,
      // puedes guardar data.user en un estado global (Zustand) o Contexto.
      console.log('Login exitoso. Bienvenido:', data.user.email);
      
      // Aquí luego lo redirigiremos al Dashboard
      router.push('/dashboard'); 

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">SaaS Facturación</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}