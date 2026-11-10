import { createContext, useContext, useState, useEffect } from "react";

const ProductsContext = createContext();

const initialProducts = [
  {
    id: 1,
    name: "Steel Rod 10mm",
    category: "Steel Rods",
    size: "10mm",
    purchasePrice: 270,
    sellingPrice: 285,
    stock: 1200,
    unit: "KG",
    minStock: 100,
  },
  {
    id: 2,
    name: "Steel Rod 12mm",
    category: "Steel Rods",
    size: "12mm",
    purchasePrice: 275,
    sellingPrice: 290,
    stock: 950,
    unit: "KG",
    minStock: 100,
  },
  {
    id: 3,
    name: "GI Pipe",
    category: "Pipes",
    size: "1 Inch",
    purchasePrice: 1500,
    sellingPrice: 1800,
    stock: 85,
    unit: "Piece",
    minStock: 15,
  },
  {
    id: 4,
    name: "Steel Pipe",
    category: "Pipes",
    size: "2 Inch",
    purchasePrice: 2800,
    sellingPrice: 3200,
    stock: 60,
    unit: "Piece",
    minStock: 10,
  },
  {
    id: 5,
    name: "Steel Sheet",
    category: "Sheets",
    size: "4 x 8 Feet",
    purchasePrice: 8000,
    sellingPrice: 8500,
    stock: 45,
    unit: "Piece",
    minStock: 10,
  },
  {
    id: 6,
    name: "Steel Angle",
    category: "Angles",
    size: "2 x 2 Inch",
    purchasePrice: 1000,
    sellingPrice: 1200,
    stock: 8,
    unit: "Piece",
    minStock: 15,
  },
  {
    id: 7,
    name: "I Beam",
    category: "Beams",
    size: "6 Inch",
    purchasePrice: 6000,
    sellingPrice: 6500,
    stock: 35,
    unit: "Piece",
    minStock: 5,
  },
];

const initialCategories = [
  {
    id: 1,
    name: "Steel Rods",
    description: "Different sizes of steel reinforcement bars.",
    color: "blue",
  },
  {
    id: 2,
    name: "Pipes",
    description: "Steel pipes and galvanized iron pipes.",
    color: "emerald",
  },
  {
    id: 3,
    name: "Sheets",
    description: "Steel sheets in different sizes and thicknesses.",
    color: "orange",
  },
  {
    id: 4,
    name: "Angles",
    description: "Steel angle bars and structural sections.",
    color: "purple",
  },
  {
    id: 5,
    name: "Beams",
    description: "I beams and other structural steel beams.",
    color: "cyan",
  },
  {
    id: 6,
    name: "Other",
    description: "Other steel products and materials.",
    color: "blue",
  },
];

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem("steel-store-products");
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem("steel-store-categories");
      return saved ? JSON.parse(saved) : initialCategories;
    } catch {
      return initialCategories;
    }
  });

  useEffect(() => {
    localStorage.setItem("steel-store-products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("steel-store-categories", JSON.stringify(categories));
  }, [categories]);

  return (
    <ProductsContext.Provider
      value={{
        products,
        setProducts,
        categories,
        setCategories,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);

  if (!context) {
    throw new Error("useProducts must be used inside ProductsProvider");
  }

  return context;
}
