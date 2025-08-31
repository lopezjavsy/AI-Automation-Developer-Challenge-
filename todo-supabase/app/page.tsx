"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";


type Task = {
  id: string;
  title: string;
  is_complete: boolean;
  user_email: string;
  inserted_at: string | null;
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    if (!email) return;
    loadTasks();
  }, [email]);

  async function loadTasks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_email", email)
      .order("inserted_at", { ascending: false });
    if (error) console.error(error);
    setTasks(data || []);
    setLoading(false);
  }

  async function addTask() {
    if (!email) {
      alert("Primero escribe tu correo (identificador de usuario).");
      return;
    }
    const title = newTitle.trim();
    if (!title) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert({ title, user_email: email })
      .select()
      .single();

    if (error) return console.error(error);
    setTasks((prev) => [data as Task, ...prev]);
    setNewTitle("");
  }

  async function toggleComplete(id: string, current: boolean) {
    const { data, error } = await supabase
      .from("tasks")
      .update({ is_complete: !current })
      .eq("id", id)
      .select()
      .single();
    if (error) return console.error(error);
    setTasks((prev) => prev.map((t) => (t.id === id ? (data as Task) : t)));
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditingTitle(task.title);
  }

  async function saveEdit() {
    if (!editingId) return;
    const title = editingTitle.trim();
    if (!title) return;

    const { data, error } = await supabase
      .from("tasks")
      .update({ title })
      .eq("id", editingId)
      .select()
      .single();

    if (error) return console.error(error);
    setTasks((prev) => prev.map((t) => (t.id === editingId ? (data as Task) : t)));
    setEditingId(null);
    setEditingTitle("");
  }

  async function removeTask(id: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) return console.error(error);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>To-Do con Next.js + Supabase</h1>

      <section style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>1) Tu correo (identificador)</h2>
        <p style={{ color: "#555" }}>Escribe tu correo para filtrar tus tareas (no hay login).</p>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <button onClick={loadTasks} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ccc", background: "#f7f7f7" }}>
            Cargar
          </button>
        </div>
      </section>

      <section style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>2) Agregar tarea</h2>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Escribe la tarea..."
            style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <button onClick={addTask} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "black", color: "white" }}>
            Añadir
          </button>
        </div>
      </section>

      <section style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>
          3) Tus tareas {loading && <small style={{ color: "#888" }}>(cargando...)</small>}
        </h2>
        {!email && <p style={{ color: "#c00" }}>Escribe tu correo y presiona “Cargar”.</p>}
        <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
          {tasks.map((task) => (
            <li key={task.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, borderBottom: "1px solid #f0f0f0" }}>
              <input
                type="checkbox"
                checked={task.is_complete}
                onChange={() => toggleComplete(task.id, task.is_complete)}
              />

              {editingId === task.id ? (
                <>
                  <input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
                  />
                  <button onClick={saveEdit} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc" }}>Guardar</button>
                  <button onClick={() => { setEditingId(null); setEditingTitle(""); }} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", background: "#f7f7f7" }}>Cancelar</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, textDecoration: task.is_complete ? "line-through" : "none", color: task.is_complete ? "#888" : "inherit" }}>
                    {task.title}
                  </span>
                  <button onClick={() => startEdit(task)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc" }}>Editar</button>
                  <button onClick={() => removeTask(task.id)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #f33", color: "#f33", background: "white" }}>Eliminar</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p style={{ marginTop: 24, color: "#777" }}>
        Los datos se guardan en Supabase (tabla <code>tasks</code>) y persisten al refrescar si usas el mismo correo.
      </p>
    </main>
  );
}
