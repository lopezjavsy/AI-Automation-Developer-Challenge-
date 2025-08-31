"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Task = {
  id: string;
  title: string;
  is_complete: boolean;
  user_email: string;
  inserted_at: string | null;
  description?: string; // Optional enriched description
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
      alert("Please enter your email first.");
      return;
    }
    const title = newTitle.trim();
    if (!title) return;

    try {
      // Send task to n8n webhook (AI enrichment happens in the workflow)
      const res = await fetch("https://estoesmerca.app.n8n.cloud/webhook/chat-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, user_email: email }),
      });

      if (!res.ok) {
        throw new Error("Error sending task to n8n workflow");
      }

      // Reload tasks after insertion
      await loadTasks();
      setNewTitle("");
    } catch (err) {
      console.error(err);
      alert("There was a problem creating the task.");
    }
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
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "Poppins, ui-sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>AI To-Do App</h1>

      {/* Email Section */}
      <section style={{ marginTop: 16, padding: 16, border: "1px solid #e5e5e5", borderRadius: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>1) Your Email</h2>
        <p style={{ color: "#555" }}>Enter your email to filter your tasks.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <button
            onClick={loadTasks}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#f9f9f9",
            }}
          >
            Load
          </button>
        </div>
      </section>

      {/* Add Task Section */}
      <section style={{ marginTop: 16, padding: 16, border: "1px solid #e5e5e5", borderRadius: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>2) Add a Task</h2>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Write a task..."
            style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <button
            onClick={addTask}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "black",
              color: "white",
              fontWeight: 500,
            }}
          >
            Add
          </button>
        </div>
      </section>

      {/* Tasks Section */}
      <section style={{ marginTop: 16, padding: 16, border: "1px solid #e5e5e5", borderRadius: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>
          3) Your Tasks {loading && <small style={{ color: "#888" }}>(loading...)</small>}
        </h2>
        {!email && <p style={{ color: "#c00" }}>Enter your email and click “Load”.</p>}
        <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
          {tasks.map((task) => (
            <li
              key={task.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: 12,
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                    <button onClick={saveEdit} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ccc" }}>
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingTitle("");
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid #ccc",
                        background: "#f7f7f7",
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        flex: 1,
                        textDecoration: task.is_complete ? "line-through" : "none",
                        color: task.is_complete ? "#888" : "inherit",
                        fontWeight: 500,
                      }}
                    >
                      {task.title}
                    </span>
                    <button
                      onClick={() => startEdit(task)}
                      style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ccc" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeTask(task.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid #f33",
                        color: "#f33",
                        background: "white",
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {/* AI-enriched description (if exists) */}
              {task.description && (
                <p style={{ marginLeft: 28, fontSize: 14, color: "#555" }}>
                  {task.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p style={{ marginTop: 24, color: "#777", fontSize: 14 }}>
        Data is stored in Supabase (<code>tasks</code> table). If you use the same email, tasks persist after refreshing.
      </p>
    </main>
  );
}
