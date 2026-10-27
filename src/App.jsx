
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Inicio from "./pages/Inicio";
import DashboardPage from "./pages/Dashboard";
import Comisarias from "./pages/Comisarias";
import Presupuesto from "./pages/Presupuesto";
import Personal from "./pages/Personal";
import Noticias from "./pages/Noticias";
import Contacto from "./pages/Contacto";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/comisarias" element={<Comisarias />} />
        <Route path="/presupuesto" element={<Presupuesto />} />
        <Route path="/personal" element={<Personal />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/contacto" element={<Contacto />} />

        <Route path="*" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
