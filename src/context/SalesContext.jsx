import { createContext, useContext, useEffect, useState } from "react";

const SalesContext = createContext(null);

export function SalesProvider({ children }) {
  const [sales, setSales] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("steel-store-sales")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("steel-store-sales", JSON.stringify(sales));
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
    let updatedSale = null;

    setSales((previous) =>
      previous.map((sale) => {
        if (sale.id !== saleId) return sale;

        updatedSale = {
          ...sale,
          ...updatedData,
          id: sale.id,
        };

        return updatedSale;
      }),
    );

    return updatedSale;
  };

  // GET SINGLE SALE
  const getSaleById = (saleId) => {
    return sales.find((sale) => sale.id === saleId);
  };

  // DELETE SALE
  const deleteSale = (saleId) => {
    setSales((previous) => previous.filter((sale) => sale.id !== saleId));
  };

  const getTotalRevenue = () =>
    sales.reduce((total, sale) => total + Number(sale.paid || 0), 0);

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
