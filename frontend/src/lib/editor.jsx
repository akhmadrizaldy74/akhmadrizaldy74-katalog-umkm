import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "./api.js";
import { useAuth } from "./auth.jsx";
import ProductForm from "../components/ProductForm.jsx";

const EditorContext = createContext({ enabled: false, version: 0 });

/**
 * Editor produk yang bisa dibuka dari mana saja (katalog, detail, panel admin).
 * `version` naik setiap ada perubahan, halaman memakainya untuk memuat ulang data.
 */
export function EditorProvider({ children }) {
  const { admin } = useAuth();
  const [editing, setEditing] = useState(null); // null | "new" | product
  const [categories, setCategories] = useState([]);
  const [version, setVersion] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (admin) api("/api/categories").then(setCategories).catch(() => {});
  }, [admin, version]);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const value = {
    enabled: Boolean(admin),
    version,
    bump,
    edit: (product) => setEditing(product),
    create: () => setEditing("new"),
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
      {admin && editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onChanged={bump}
          onSaved={(saved) => {
            // di halaman detail: produk dihapus -> ke katalog; nama diganti -> slug baru
            const onDetail = location.pathname.startsWith("/produk/");
            if (onDetail && saved === null) navigate("/", { replace: true });
            else if (onDetail && saved && editing !== "new" && saved.slug !== editing.slug) navigate(`/produk/${saved.slug}`, { replace: true });
            setEditing(null);
            bump();
          }}
        />
      )}
    </EditorContext.Provider>
  );
}

export const useEditor = () => useContext(EditorContext);
