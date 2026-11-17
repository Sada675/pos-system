import { createContext, useState, useEffect, useContext } from "react";

const CustomersContext = createContext(null);

const STORAGE_KEY = "steel-store-customers";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

// Normalize Pakistani phone numbers
// 03001234567
// +923001234567
// 923001234567
// 00923001234567
// All become: 03001234567
const normalizePhone = (phone) => {
  let value = String(phone || "").replace(/\D/g, "");

  if (value.startsWith("0092")) {
    value = `0${value.slice(4)}`;
  } else if (value.startsWith("92")) {
    value = `0${value.slice(2)}`;
  }

  return value;
};

const normalizeName = (name) =>
  String(name || "")
    .trim()
    .toLowerCase();

const isWalkInCustomer = (name) => normalizeName(name) === "walk-in customer";

const getSaleAmounts = (sale) => {
  const grandTotal = toNumber(sale?.grandTotal);
  const paid = toNumber(sale?.paid);

  const balance =
    sale?.balance !== undefined && sale?.balance !== null
      ? toNumber(sale.balance)
      : Math.max(0, grandTotal - paid);

  return {
    grandTotal,
    paid,
    balance,
  };
};

const getSaleDate = (sale) =>
  sale?.saleDate || sale?.createdAt || new Date().toISOString();

const getInvoiceNumber = (sale) => sale?.invoiceNumber || null;

// Check whether two sales belong to the same customer
const isSameCustomer = (first, second) => {
  const firstPhone = normalizePhone(first?.customerPhone || first?.phone);
  const secondPhone = normalizePhone(second?.customerPhone || second?.phone);

  if (firstPhone && secondPhone) {
    return firstPhone === secondPhone;
  }

  // If both have no phone, compare names
  if (!firstPhone && !secondPhone) {
    return (
      normalizeName(first?.customerName || first?.name) ===
      normalizeName(second?.customerName || second?.name)
    );
  }

  return false;
};

// Find customer by phone, or by name when phone is unavailable
const findCustomer = (list, sale) => {
  const phone = normalizePhone(sale?.customerPhone);
  const name = normalizeName(sale?.customerName);

  return list.find((customer) => {
    const customerPhone = normalizePhone(customer.phone);

    if (phone) {
      return customerPhone === phone;
    }

    return !customerPhone && normalizeName(customer.name) === name;
  });
};

export function CustomersProvider({ children }) {
  const [customers, setCustomers] = useState(() => {
    try {
      const savedCustomers = localStorage.getItem(STORAGE_KEY);
      const parsed = savedCustomers ? JSON.parse(savedCustomers) : [];

      return Array.isArray(parsed) ? parsed : [];
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

  // Add a new customer purchase after creating a sale
  const addOrUpdateCustomer = (sale) => {
    if (!sale) return;

    const customerName = String(sale.customerName || "").trim();
    const customerPhone = normalizePhone(sale.customerPhone);

    if (!customerName || isWalkInCustomer(customerName)) {
      return;
    }

    const { grandTotal, paid, balance } = getSaleAmounts(sale);

    setCustomers((previous) => {
      const existingCustomer = findCustomer(previous, sale);

      if (existingCustomer) {
        return previous.map((customer) => {
          if (customer.id !== existingCustomer.id) return customer;

          const invoiceNumber = getInvoiceNumber(sale);

          const invoices = [invoiceNumber, ...(customer.invoices || [])].filter(
            (invoice, index, array) =>
              invoice && array.indexOf(invoice) === index,
          );

          return {
            ...customer,
            name: customerName,
            phone: customerPhone || customer.phone || "",
            totalPurchases: toNumber(customer.totalPurchases) + grandTotal,
            totalPaid: toNumber(customer.totalPaid) + paid,
            outstanding: toNumber(customer.outstanding) + balance,
            totalOrders: toNumber(customer.totalOrders) + 1,
            lastPurchase: getSaleDate(sale),
            invoices,
          };
        });
      }

      const newCustomer = {
        id: `CUST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: customerName,
        phone: customerPhone,
        email: "",
        address: "",
        totalPurchases: grandTotal,
        totalPaid: paid,
        outstanding: balance,
        totalOrders: 1,
        lastPurchase: getSaleDate(sale),
        invoices: getInvoiceNumber(sale) ? [getInvoiceNumber(sale)] : [],
        createdAt: new Date().toISOString(),
      };

      return [newCustomer, ...previous];
    });
  };

  // Add or subtract a sale from a customer's totals
  const adjustCustomerTotals = (customer, sale, multiplier) => {
    const { grandTotal, paid, balance } = getSaleAmounts(sale);

    return {
      ...customer,
      totalPurchases: Math.max(
        0,
        toNumber(customer.totalPurchases) + grandTotal * multiplier,
      ),
      totalPaid: Math.max(0, toNumber(customer.totalPaid) + paid * multiplier),
      outstanding: Math.max(
        0,
        toNumber(customer.outstanding) + balance * multiplier,
      ),
      totalOrders: Math.max(0, toNumber(customer.totalOrders) + multiplier),
    };
  };

  // Update customer totals when an existing invoice is edited
  // Handles same customer, changed customer, and walk-in customer.
  const updateCustomerAfterSale = (oldSale, updatedSale, allSales = []) => {
    if (!oldSale || !updatedSale) return;

    const oldName = String(oldSale.customerName || "").trim();
    const newName = String(updatedSale.customerName || "").trim();

    const oldIsCustomer = oldName && !isWalkInCustomer(oldName);
    const newIsCustomer = newName && !isWalkInCustomer(newName);

    const oldInvoice = getInvoiceNumber(oldSale);
    const newInvoice = getInvoiceNumber(updatedSale);

    const sameCustomer =
      oldIsCustomer && newIsCustomer && isSameCustomer(oldSale, updatedSale);

    setCustomers((previous) => {
      let updatedCustomers = [...previous];

      const oldCustomer = oldIsCustomer
        ? findCustomer(updatedCustomers, oldSale)
        : null;

      const newCustomer = newIsCustomer
        ? findCustomer(updatedCustomers, updatedSale)
        : null;

      // CASE 1: Same customer, only invoice details changed
      if (sameCustomer && oldCustomer) {
        updatedCustomers = updatedCustomers.map((customer) => {
          if (customer.id !== oldCustomer.id) return customer;

          // Subtract old sale and add updated sale
          let updated = adjustCustomerTotals(customer, oldSale, -1);
          updated = adjustCustomerTotals(updated, updatedSale, 1);

          const invoices = (customer.invoices || []).filter(
            (invoice) => invoice !== oldInvoice,
          );

          if (newInvoice && !invoices.includes(newInvoice)) {
            invoices.unshift(newInvoice);
          }

          return {
            ...updated,
            name: newName || customer.name,
            phone:
              normalizePhone(updatedSale.customerPhone) || customer.phone || "",
            invoices,
            lastPurchase: getSaleDate(updatedSale),
          };
        });

        return updatedCustomers;
      }

      // CASE 2: Customer changed or sale changed to walk-in
      if (oldCustomer) {
        updatedCustomers = updatedCustomers.map((customer) => {
          if (customer.id !== oldCustomer.id) return customer;

          const updated = adjustCustomerTotals(customer, oldSale, -1);

          return {
            ...updated,
            invoices: (customer.invoices || []).filter(
              (invoice) => invoice !== oldInvoice,
            ),
          };
        });
      }

      // CASE 3: New customer exists, add the edited sale to them
      if (newIsCustomer) {
        const targetCustomer = findCustomer(updatedCustomers, updatedSale);

        if (targetCustomer) {
          updatedCustomers = updatedCustomers.map((customer) => {
            if (customer.id !== targetCustomer.id) return customer;

            const updated = adjustCustomerTotals(customer, updatedSale, 1);

            const invoices = [newInvoice, ...(customer.invoices || [])].filter(
              (invoice, index, array) =>
                invoice && array.indexOf(invoice) === index,
            );

            return {
              ...updated,
              name: newName,
              phone:
                normalizePhone(updatedSale.customerPhone) ||
                customer.phone ||
                "",
              invoices,
              lastPurchase: getSaleDate(updatedSale),
            };
          });
        } else {
          // New customer does not exist, create one
          const { grandTotal, paid, balance } = getSaleAmounts(updatedSale);

          const newCustomer = {
            id: `CUST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: newName,
            phone: normalizePhone(updatedSale.customerPhone),
            email: "",
            address: "",
            totalPurchases: grandTotal,
            totalPaid: paid,
            outstanding: balance,
            totalOrders: 1,
            lastPurchase: getSaleDate(updatedSale),
            invoices: newInvoice ? [newInvoice] : [],
            createdAt: new Date().toISOString(),
          };

          updatedCustomers.unshift(newCustomer);
        }
      }

      // Recalculate last purchase from remaining sales when available
      if (Array.isArray(allSales) && allSales.length > 0) {
        const salesWithoutEditedInvoice = allSales.filter(
          (sale) => sale.id !== oldSale.id,
        );

        const remainingSales = [updatedSale, ...salesWithoutEditedInvoice];

        updatedCustomers = updatedCustomers.map((customer) => {
          const customerSales = remainingSales
            .filter(
              (sale) =>
                sale.customerName &&
                !isWalkInCustomer(sale.customerName) &&
                isSameCustomer(
                  {
                    customerName: customer.name,
                    customerPhone: customer.phone,
                  },
                  sale,
                ),
            )
            .sort(
              (a, b) =>
                new Date(getSaleDate(b)).getTime() -
                new Date(getSaleDate(a)).getTime(),
            );

          return {
            ...customer,
            lastPurchase: customerSales.length
              ? getSaleDate(customerSales[0])
              : null,
          };
        });
      }

      return updatedCustomers;
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
      id: `CUST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
    const name = String(updatedData.name || "").trim();
    const phone = normalizePhone(updatedData.phone);

    if (!name) {
      return {
        success: false,
        message: "Customer name is required.",
      };
    }

    const duplicatePhone = customers.some(
      (customer) =>
        customer.id !== id && phone && normalizePhone(customer.phone) === phone,
    );

    if (duplicatePhone) {
      return {
        success: false,
        message: "Another customer already has this phone number.",
      };
    }

    setCustomers((previous) =>
      previous.map((customer) =>
        customer.id === id
          ? {
              ...customer,
              ...updatedData,
              name,
              phone,
            }
          : customer,
      ),
    );

    return {
      success: true,
      message: "Customer updated successfully.",
    };
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
