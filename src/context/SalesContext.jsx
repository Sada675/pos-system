import { createContext, useContext, useEffect, useState } from "react";

const SalesContext = createContext(null);

export function SalesProvider({ children }) {
  const [sales, setSales] = useState(() => {
    try {
      const savedSales = localStorage.getItem("steel-store-sales");
      const parsed = savedSales ? JSON.parse(savedSales) : [];

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error loading sales:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("steel-store-sales", JSON.stringify(sales));
    } catch (error) {
      console.error("Error saving sales:", error);
    }
  }, [sales]);

  // ADD NEW SALE
  const addSale = (sale) => {
    const newSale = {
      ...sale,
      id: Date.now(),
    };

    setSales((previous) => [newSale, ...previous]);

    return newSale;
  };

  // UPDATE EXISTING SALE
  const updateSale = (saleId, updatedData) => {
    // Find existing sale from current state
    const existingSale = sales.find((sale) => sale.id === saleId);

    if (!existingSale) {
      console.error("Sale not found:", saleId);
      return null;
    }

    const updatedSale = {
      ...existingSale,
      ...updatedData,
      id: existingSale.id,
    };

    setSales((previous) =>
      previous.map((sale) => (sale.id === saleId ? updatedSale : sale)),
    );

    return updatedSale;
  };

  // GET SINGLE SALE
  const getSaleById = (saleId) => {
    return sales.find((sale) => sale.id === saleId) || null;
  };

  // DELETE SALE
  const deleteSale = (saleId) => {
    const saleExists = sales.some((sale) => sale.id === saleId);

    if (!saleExists) {
      return {
        success: false,
        message: "Sale not found.",
      };
    }

    setSales((previous) => previous.filter((sale) => sale.id !== saleId));

    return {
      success: true,
      message: "Sale deleted successfully.",
    };
  };

  // TOTAL REVENUE
  const getTotalRevenue = () =>
    sales.reduce((total, sale) => total + Number(sale.paid || 0), 0);

  // TOTAL SALES
  const getTotalSales = () => sales.length;

  return (
    <SalesContext.Provider
      value={{
        sales,
        setSales,
        addSale,
        updateSale,
        getSaleById,
        deleteSale,
        getTotalRevenue,
        getTotalSales,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const context = useContext(SalesContext);

  if (!context) {
    throw new Error("useSales must be used inside SalesProvider");
  }

  return context;
}
