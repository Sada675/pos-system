import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { ProductsProvider } from "./context/ProductsContext";
import { SalesProvider } from "./context/SalesContext";
import { CustomersProvider } from "./context/CustomersContext";
import { SettingsProvider } from "./context/SettingsContext";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SettingsProvider>
      <ProductsProvider>
        <SalesProvider>
          <CustomersProvider>
            <App />
          </CustomersProvider>
        </SalesProvider>
      </ProductsProvider>
    </SettingsProvider>
  </React.StrictMode>,
);
