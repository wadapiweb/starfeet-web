"use client";

import { useState, useEffect, FormEvent } from "react";

type UserProfile = {
  name: string | null;
  email: string;
  phone: string | null;
};

type UpdateProfilePayload = {
  name: string | null;
  phone: string | null;
  currentPassword?: string;
  newPassword?: string;
};

export function AdminProfileForm() {
  const [profile, setProfile] = useState<UserProfile>({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [passwords, setPasswords] = useState({ current: "", newPass: "" });

  useEffect(() => {
    fetch("/api/v1/admin/profile")
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setProfile({
            name: d.user.name || "",
            email: d.user.email || "",
            phone: d.user.phone || ""
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload: UpdateProfilePayload = {
      name: profile.name,
      phone: profile.phone,
    };

    if (passwords.current && passwords.newPass) {
      payload.currentPassword = passwords.current;
      payload.newPassword = passwords.newPass;
    }

    try {
      const res = await fetch("/api/v1/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al actualizar perfil");
      
      setMessage({ text: "Perfil actualizado correctamente", isError: false });
      setPasswords({ current: "", newPass: "" }); // Reset passwords on success
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Error", isError: true });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Cargando perfil...</p>;

  return (
    <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="font-condensed text-3xl font-black uppercase text-starfeet-blue mb-6">Mi Perfil</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b pb-2">Información Básica</h3>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Email</label>
            <input 
              type="text" 
              disabled 
              value={profile.email} 
              className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-500" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Nombre Completo</label>
              <input 
                type="text" 
                value={profile.name || ""} 
                onChange={e => setProfile({...profile, name: e.target.value})}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:border-starfeet-blue outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Teléfono</label>
              <input 
                type="text" 
                value={profile.phone || ""} 
                onChange={e => setProfile({...profile, phone: e.target.value})}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:border-starfeet-blue outline-none" 
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b pb-2">Cambiar Contraseña</h3>
          <p className="text-xs text-gray-500">Dejar en blanco si no deseas cambiarla.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Contraseña Actual</label>
              <input 
                type="password" 
                value={passwords.current} 
                onChange={e => setPasswords({...passwords, current: e.target.value})}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:border-starfeet-blue outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Nueva Contraseña</label>
              <input 
                type="password" 
                value={passwords.newPass} 
                onChange={e => setPasswords({...passwords, newPass: e.target.value})}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:border-starfeet-blue outline-none" 
              />
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm font-bold ${message.isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message.text}
          </div>
        )}

        <button 
          type="submit" 
          disabled={saving}
          className="bg-starfeet-blue text-white font-bold text-sm uppercase tracking-widest py-3 px-6 rounded-xl hover:bg-blue-900 transition disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>
    </div>
  );
}
