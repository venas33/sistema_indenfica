import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

// Defina suas rotas aqui
const routes = [
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/usuario/:cpf",
    element: <User />,
  },
];

// Crie o roteador com as flags futuras habilitadas
const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <RouterProvider router={router} />
  </ErrorBoundary>
);