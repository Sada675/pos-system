import { createContext, useState, useEffect, useContext } from "react";

const CustomersContext = createContext(null);

const STORAGE_KEY = "steel-store-customers";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizePhone = (phone) => String(phone || "").trim();

const normalizeName = (name) =>
  String(name || "")
    .trim()
    .toLowerCase();

export function CustomersProvider({ children }) {
  const [customers, setCustomers] = useState(() => {
    try {
      const savedCustomers = localStorage.getItem(STORAGE_KEY);
      return savedCustomers ? JSON.parse(savedCustomers) : [];
    } catch (error) {
      console.error("Error loading customers:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    } catch (error) {
      console.error("Error saving customers:", error);
    }
  }, [customers]);

  // Find customer using phone or name
  const findCustomer = (list, sale) => {
    const phone = normalizePhone(sale.customerPhone);
    const name = normalizeName(sale.customerName);

    return list.find((customer) => {
      if (phone) {
        return normalizePhone(customer.phone) === phone;
      }

      return (
        !normalizePhone(customer.phone) && normalizeName(customer.name) === name
      );
    });
  };

  // Add customer purchase after a new sale
  const addOrUpdateCustomer = (sale) => {
    if (!sale) return;

    const customerName = String(sale.customerName || "").trim();
    const customerPhone = normalizePhone(sale.customerPhone);

    if (!customerName || customerName.toLowerCase() === "walk-in customer") {
      return;
    }

    const grandTotal = toNumber(sale.grandTotal);
    const paid = toNumber(sale.paid);
    const balance = toNumber(sale.balance);

    setCustomers((previous) => {
      const existingCustomer = findCustomer(previous, sale);

      if (existingCustomer) {
        return previous.map((customer) => {
          if (customer.id !== existingCustomer.id) return customer;

          return {
            ...customer,
            name: customerName,
            phone: customerPhone || customer.phone || "",
            totalPurchases: toNumber(customer.totalPurchases) + grandTotal,
            totalPaid: toNumber(customer.totalPaid) + paid,
            outstanding: toNumber(customer.outstanding) + balance,
            totalOrders: toNumber(customer.totalOrders) + 1,
            lastPurchase: sale.saleDate || new Date().toISOString(),
            invoices: [sale.invoiceNumber, ...(customer.invoices || [])].filter(
              Boolean,
            ),
          };
        });
      }

      const newCustomer = {
        id: `CUST-${Date.now()}`,
        name: customerName,
        phone: customerPhone,
        totalPurchases: grandTotal,
        totalPaid: paid,
        outstanding: balance,
        totalOrders: 1,
        lastPurchase: sale.saleDate || new Date().toISOString(),
        invoices: sale.invoiceNumber ? [sale.invoiceNumber] : [],
        createdAt: new Date().toISOString(),
      };

      return [newCustomer, ...previous];
    });
  };

  // Update customer totals when an existing invoice is edited
  const updateCustomerAfterSale = (oldSale, updatedSale) => {
    if (!oldSale || !updatedSale) return;

    const oldName = String(oldSale.customerName || "").trim();
    const newName = String(updatedSale.customerName || "").trim();

    if (!oldName || oldName.toLowerCase() === "walk-in customer") {
      return;
    }

    const oldPhone = normalizePhone(oldSale.customerPhone);
    const newPhone = normalizePhone(updatedSale.customerPhone);

    const oldGrandTotal = toNumber(oldSale.grandTotal);
    const newGrandTotal = toNumber(updatedSale.grandTotal);

    const oldPaid = toNumber(oldSale.paid);
    const newPaid = toNumber(updatedSale.paid);

    const oldBalance = toNumber(oldSale.balance);
    const newBalance = toNumber(updatedSale.balance);

    setCustomers((previous) => {
      const existingCustomer = findCustomer(previous, oldSale);

      if (!existingCustomer) return previous;

      return previous.map((customer) => {
        if (customer.id !== existingCustomer.id) return customer;

        const invoices = customer.invoices || [];

        return {
          ...customer,
          name: newName || customer.name,
          phone: newPhone || customer.phone || "",
          totalPurchases: Math.max(
            0,
            toNumber(customer.totalPurchases) + (newGrandTotal - oldGrandTotal),
          ),
          totalPaid: Math.max(
            0,
            toNumber(customer.totalPaid) + (newPaid - oldPaid),
          ),
          outstanding: Math.max(
            0,
            toNumber(customer.outstanding) + (newBalance - oldBalance),
          ),
          lastPurchase: updatedSale.saleDate || customer.lastPurchase,
          invoices: invoices.includes(updatedSale.invoiceNumber)
            ? invoices
            : [updatedSale.invoiceNumber, ...invoices].filter(Boolean),
        };
      });
    });
  };

  // Manually add customer
  const addCustomer = (customer) => {
    if (!customer) {
      return {
        success: false,
        message: "Invalid customer data.",
      };
    }

    const name = String(customer.name || "").trim();
    const phone = normalizePhone(customer.phone);

    if (!name) {
      return {
        success: false,
        message: "Customer name is required.",
      };
    }

    if (
      phone &&
      customers.some((item) => normalizePhone(item.phone) === phone)
    ) {
      return {
        success: false,
        message: "Customer with this phone number already exists.",
      };
    }

    const newCustomer = {
      ...customer,
      id: `CUST-${Date.now()}`,
      name,
      phone,
      totalPurchases: 0,
      totalPaid: 0,
      outstanding: 0,
      totalOrders: 0,
      invoices: [],
      lastPurchase: null,
      createdAt: new Date().toISOString(),
    };

    setCustomers((previous) => [newCustomer, ...previous]);

    return {
      success: true,
      message: "Customer added successfully.",
      customer: newCustomer,
    };
  };

  // Manually update customer
  const updateCustomer = (id, updatedData) => {
    setCustomers((previous) =>
      previous.map((customer) =>
        customer.id === id
          ? {
              ...customer,
              ...updatedData,
              name: String(updatedData.name ?? customer.name).trim(),
              phone: normalizePhone(updatedData.phone ?? customer.phone),
            }
          : customer,
      ),
    );
  };

  // Delete customer
  const deleteCustomer = (id) => {
    setCustomers((previous) =>
      previous.filter((customer) => customer.id !== id),
    );
  };

  // Get customer by ID
  const getCustomerById = (id) =>
    customers.find((customer) => customer.id === id);

  return (
    <CustomersContext.Provider
      value={{
        customers,
        setCustomers,
        addCustomer,
        addOrUpdateCustomer,
        updateCustomerAfterSale,
        updateCustomer,
        deleteCustomer,
        getCustomerById,
      }}
    >
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomersContext);

  if (!context) {
    throw new Error(
      "useCustomers must be used inside CustomersProvider. Wrap your App with CustomersProvider.",
    );
  }

  return context;
}
