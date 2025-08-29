import React, { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

// helpers
const authH = (token) => ({ Authorization: `Bearer ${token}` });
const j = (res) => (res.ok ? res.json() : res.text().then((t) => Promise.reject(t)));

export default function AdminMessages({ token }) {
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [filter, setFilter] = useState("");
  const [edit, setEdit] = useState(null); // {id?, category_id, title, body, is_active}

  const headers = useMemo(
    () => ({ "Content-Type": "application/json", ...authH(token) }),
    [token]
  );

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([
        fetch(`${API}/admin/categories`, { headers: authH(token) }).then(j),
        fetch(`${API}/admin/messages`, { headers: authH(token) }).then(j),
      ]);
      setCats(c);
      setMsgs(m);
      if (!selectedCatId && c.length) setSelectedCatId(c[0].id);
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar categorias/mensagens. Verifique CORS e token.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCat = cats.find((c) => c.id === selectedCatId) || null;

  const filtered = msgs
    .filter((m) => (selectedCatId ? m.category_id === selectedCatId : true))
    .filter((m) =>
      filter.trim()
        ? (m.title || "").toLowerCase().includes(filter.toLowerCase()) ||
          (m.body || "").toLowerCase().includes(filter.toLowerCase())
        : true
    )
    .sort((a, b) => String(a.title).localeCompare(String(b.title)));

  // ----- Categoria: criar / renomear / ativar-desativar -----
  const createCat = async () => {
    const name = prompt("Nome da categoria:");
    if (!name) return;
    try {
      const c = await fetch(`${API}/admin/categories`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, is_active: true }),
      }).then(j);
      setCats((xs) => [...xs, c]);
      setSelectedCatId(c.id);
    } catch (e) {
      alert("Erro ao criar categoria: " + e);
    }
  };

  const renameCat = async (cat) => {
    const name = prompt("Novo nome da categoria:", cat.name);
    if (!name) return;
    try {
      const c = await fetch(`${API}/admin/categories/${cat.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ name, is_active: cat.is_active }),
      }).then(j);
      setCats((xs) => xs.map((x) => (x.id === c.id ? c : x)));
    } catch (e) {
      alert("Erro ao renomear: " + e);
    }
  };

  const toggleCat = async (cat) => {
    try {
      const c = await fetch(`${API}/admin/categories/${cat.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ name: cat.name, is_active: !cat.is_active }),
      }).then(j);
      setCats((xs) => xs.map((x) => (x.id === c.id ? c : x)));
    } catch (e) {
      alert("Erro ao atualizar categoria: " + e);
    }
  };

  // ----- Mensagem: criar / editar / (des)ativar -----
  const startNewMsg = () =>
    setEdit({
      id: null,
      category_id: selectedCatId || (cats[0] && cats[0].id) || null,
      title: "",
      body: "",
      is_active: true,
    });

  const startEditMsg = (m) => setEdit({ ...m });

  const saveMsg = async () => {
    try {
      if (!edit.title?.trim() || !edit.body?.trim() || !edit.category_id) {
        alert("Preencha título, corpo e categoria.");
        return;
      }
      if (edit.id) {
        const updated = await fetch(`${API}/admin/messages/${edit.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            category_id: edit.category_id,
            title: edit.title,
            body: edit.body,
            is_active: !!edit.is_active,
          }),
        }).then(j);
        setMsgs((xs) => xs.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await fetch(`${API}/admin/messages`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            category_id: edit.category_id,
            title: edit.title,
            body: edit.body,
            is_active: !!edit.is_active,
          }),
        }).then(j);
        setMsgs((xs) => [...xs, created]);
      }
      setEdit(null);
    } catch (e) {
      alert("Erro ao salvar: " + e);
    }
  };

  const toggleMsg = async (m) => {
    try {
      const updated = await fetch(`${API}/admin/messages/${m.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          category_id: m.category_id,
          title: m.title,
          body: m.body,
          is_active: !m.is_active,
        }),
      }).then(j);
      setMsgs((xs) => xs.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      alert("Erro ao mudar status da mensagem: " + e);
    }
  };

  if (loading) return <p style={{ padding: 16 }}>Carregando…</p>;

  return (
    <div className="card" style={{ margin: "16px auto", padding: 16, maxWidth: 1100 }}>
      <h3>Categorias & Mensagens</h3>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
        {/* LADO ESQUERDO: categorias */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Categorias</strong>
            <button className="secondary" onClick={createCat}>+ Nova</button>
          </div>
          <div className="list" style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
            {cats.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCatId(c.id)}
                style={{
                  padding: "8px 10px",
                  cursor: "pointer",
                  background: selectedCatId === c.id ? "#f6f6f6" : "white",
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                title={c.is_active ? "Ativa" : "Inativa"}
              >
                <span
                  style={{
                    width: 8, height: 8, borderRadius: 99,
                    background: c.is_active ? "seagreen" : "silver",
                  }}
                />
                <span style={{ flex: 1 }}>{c.name}</span>
                <button className="secondary" onClick={(e) => (e.stopPropagation(), renameCat(c))}>Renomear</button>
                <button className="secondary" onClick={(e) => (e.stopPropagation(), toggleCat(c))}>
                  {c.is_active ? "Inativar" : "Ativar"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* LADO DIREITO: mensagens */}
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <strong style={{ flex: 1 }}>
              {currentCat ? `Mensagens — ${currentCat.name}` : "Mensagens"}
            </strong>
            <input
              placeholder="Pesquisar título ou texto…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ maxWidth: 320 }}
            />
            <button onClick={startNewMsg}>+ Nova mensagem</button>
          </div>

          <div className="list" style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
            {filtered.length === 0 && (
              <div style={{ padding: 12, color: "#666" }}>Nenhuma mensagem encontrada.</div>
            )}

            {filtered.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 8,
                  padding: "10px 12px",
                  borderBottom: "1px solid #eee",
                  alignItems: "center",
                  background: m.is_active ? "white" : "#fafafa",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{m.title}</div>
                  <div style={{ whiteSpace: "pre-wrap", opacity: 0.8 }}>{m.body}</div>
                </div>
                <button className="secondary" onClick={() => startEditMsg(m)}>Editar</button>
                <button className="secondary" onClick={() => toggleMsg(m)}>
                  {m.is_active ? "Inativar" : "Ativar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de edição/criação */}
      {edit && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
            display: "grid", placeItems: "center", padding: 16, zIndex: 50,
          }}
          onClick={() => setEdit(null)}
        >
          <div
            className="card"
            style={{ width: "min(900px, 96vw)", maxHeight: "90vh", overflow: "auto", padding: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>{edit.id ? "Editar mensagem" : "Nova mensagem"}</h3>

            <div className="grid" style={{ gap: 12 }}>
              <label>
                Categoria
                <select
                  value={edit.category_id || ""}
                  onChange={(e) => setEdit({ ...edit, category_id: Number(e.target.value) })}
                >
                  <option value="" disabled>Selecione</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.is_active ? "" : " (inativa)"}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Título
                <input
                  value={edit.title}
                  onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                />
              </label>

              <label>
                Texto (corpo)
                <textarea
                  rows={10}
                  value={edit.body}
                  onChange={(e) => setEdit({ ...edit, body: e.target.value })}
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!edit.is_active}
                  onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })}
                />
                Ativa
              </label>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={saveMsg}>{edit.id ? "Salvar" : "Criar"}</button>
              <button className="secondary" onClick={() => setEdit(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
