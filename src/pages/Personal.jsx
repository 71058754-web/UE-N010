
import { useEffect, useState } from "react";
import api from "../services/api";
import * as XLSX from "xlsx";
const formularioInicial = {
  dni: "",
  grado: "",
  nombres: "",
  apellidos: "",
  regionId: "",
  dependencia: "",
  cargo: "",
  estado: "Activo",
};

function Personal() {
  const [personal, setPersonal] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRegion, setFiltroRegion] = useState("todas");
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setError("");

    try {
      const [respuestaPersonal, respuestaRegiones] =
        await Promise.all([
          api.get("/personal"),
          api.get("/regiones"),
        ]);

      setPersonal(respuestaPersonal.data);
      setRegiones(respuestaRegiones.data);
    } catch (err) {
      console.error("Error al cargar personal:", err);
      setError(
        "No se pudieron cargar los datos. Verifica que json-server esté funcionando y que exista la colección personal."
      );
    } finally {
      setCargando(false);
    }
  }

  function actualizarCampo(e) {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function limpiarFormulario() {
    setFormulario(formularioInicial);
    setEditandoId(null);
    setError("");
    setMensaje("");
  }

  async function guardarPersonal(e) {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (
      !formulario.dni.trim() ||
      !formulario.grado.trim() ||
      !formulario.nombres.trim() ||
      !formulario.apellidos.trim() ||
      !formulario.regionId
    ) {
      setError(
        "Completa el DNI, grado, nombres, apellidos y región policial."
      );
      return;
    }

    if (!/^\d{8}$/.test(formulario.dni.trim())) {
      setError("El DNI debe contener exactamente 8 dígitos.");
      return;
    }

    const dniDuplicado = personal.some(
      (p) =>
        String(p.dni) === formulario.dni.trim() &&
        String(p.id) !== String(editandoId)
    );

    if (dniDuplicado) {
      setError("Ya existe un registro con ese DNI.");
      return;
    }

    const datos = {
      ...formulario,
      dni: formulario.dni.trim(),
      grado: formulario.grado.trim(),
      nombres: formulario.nombres.trim(),
      apellidos: formulario.apellidos.trim(),
      dependencia: formulario.dependencia.trim(),
      cargo: formulario.cargo.trim(),
      regionId: formulario.regionId,
    };

    setGuardando(true);

    try {
      if (editandoId !== null) {
        await api.put(`/personal/${editandoId}`, datos);
        setMensaje("Personal actualizado correctamente.");
      } else {
        await api.post("/personal", datos);
        setMensaje("Personal registrado correctamente.");
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err) {
      console.error("Error al guardar personal:", err);
      setError("No se pudo guardar el registro. Intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  }

  function editarPersonal(persona) {
    setFormulario({
      dni: String(persona.dni ?? ""),
      grado: persona.grado ?? "",
      nombres: persona.nombres ?? "",
      apellidos: persona.apellidos ?? "",
      regionId: String(persona.regionId ?? ""),
      dependencia: persona.dependencia ?? "",
      cargo: persona.cargo ?? "",
      estado: persona.estado ?? "Activo",
    });

    setEditandoId(persona.id);
    setError("");
    setMensaje("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminarPersonal(persona) {
    const confirmar = window.confirm(
      `¿Deseas eliminar el registro de ${persona.nombres} ${persona.apellidos}?`
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    try {
      await api.delete(`/personal/${persona.id}`);
      setMensaje("Registro eliminado correctamente.");

      if (String(editandoId) === String(persona.id)) {
        limpiarFormulario();
      }

      await cargarDatos();
    } catch (err) {
      console.error("Error al eliminar personal:", err);
      setError("No se pudo eliminar el registro.");
    }
  }

  function nombreRegion(regionId) {
    const region = regiones.find(
      (r) => String(r.id) === String(regionId)
    );

    if (!region) return "Sin región";

    return (
      region.nombre ??
      region.nombreRegion ??
      region.region ??
      region.descripcion ??
      region.codigo ??
      `Región ${region.id}`
    );
  }
  
function exportarExcel() {
  const datosExcel = personalFiltrado.map((persona) => ({
    DNI: persona.dni,
    Grado: persona.grado,
    Nombres: persona.nombres,
    Apellidos: persona.apellidos,
    Region: nombreRegion(persona.regionId),
    Dependencia: persona.dependencia || "",
    Cargo: persona.cargo || "",
    Estado: persona.estado || "Sin estado",
  }));

  if (datosExcel.length === 0) {
    setError("No hay registros para exportar.");
    setMensaje("");
    return;
  }

  const hoja = XLSX.utils.json_to_sheet(datosExcel);

  hoja["!cols"] = [
    { wch: 12 },
    { wch: 16 },
    { wch: 24 },
    { wch: 28 },
    { wch: 22 },
    { wch: 30 },
    { wch: 25 },
    { wch: 15 },
  ];

  const libro = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    libro,
    hoja,
    "Personal policial"
  );

  XLSX.writeFile(libro, "Personal_Policial_SIGI010.xlsx");

  setError("");
  setMensaje("Archivo Excel generado correctamente.");
}

  const personalFiltrado = personal.filter((persona) => {
    const texto = [
      persona.dni,
      persona.grado,
      persona.nombres,
      persona.apellidos,
      persona.dependencia,
      persona.cargo,
      nombreRegion(persona.regionId),
    ]
      .join(" ")
      .toLowerCase();

    const coincideBusqueda = texto.includes(
      busqueda.trim().toLowerCase()
    );

    const coincideRegion =
      filtroRegion === "todas" ||
      String(persona.regionId) === filtroRegion;

    return coincideBusqueda && coincideRegion;
  });

  const totalActivos = personal.filter(
    (p) => p.estado === "Activo"
  ).length;

  const totalInactivos = personal.filter(
    (p) => p.estado === "Inactivo"
  ).length;

  return (
    <main className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          
<div className="d-flex flex-wrap gap-2">
  <button
    type="button"
    className="btn btn-success"
    onClick={exportarExcel}
    disabled={cargando || personalFiltrado.length === 0}
  >
    Exportar Excel
  </button>

  <button
    type="button"
    className="btn btn-outline-primary"
    onClick={cargarDatos}
    disabled={cargando}
  >
    Actualizar datos
  </button>
</div>

          <p className="text-secondary mb-0">
            Registro y control del personal policial de la UE 010.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={cargarDatos}
          disabled={cargando}
        >
          Actualizar datos
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="alert alert-success" role="status">
          {mensaje}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-1">
                Total de registros
              </p>
              <h3 className="fw-bold mb-0">{personal.length}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-1">
                Personal activo
              </p>
              <h3 className="fw-bold text-success mb-0">
                {totalActivos}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-1">
                Personal inactivo
              </p>
              <h3 className="fw-bold text-danger mb-0">
                {totalInactivos}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0 fw-bold">
            {editandoId !== null
              ? "Editar personal policial"
              : "Registrar personal policial"}
          </h5>
        </div>

        <div className="card-body">
          <form onSubmit={guardarPersonal}>
            <div className="row g-3">
              <div className="col-md-4 col-lg-3">
                <label className="form-label">DNI *</label>
                <input
                  type="text"
                  name="dni"
                  className="form-control"
                  value={formulario.dni}
                  onChange={actualizarCampo}
                  maxLength={8}
                  inputMode="numeric"
                  placeholder="8 dígitos"
                  required
                />
              </div>

              <div className="col-md-4 col-lg-3">
                <label className="form-label">Grado *</label>
                <input
                  type="text"
                  name="grado"
                  className="form-control"
                  value={formulario.grado}
                  onChange={actualizarCampo}
                  placeholder="Ej. S1 PNP"
                  required
                />
              </div>

              <div className="col-md-4 col-lg-3">
                <label className="form-label">Nombres *</label>
                <input
                  type="text"
                  name="nombres"
                  className="form-control"
                  value={formulario.nombres}
                  onChange={actualizarCampo}
                  required
                />
              </div>

              <div className="col-md-4 col-lg-3">
                <label className="form-label">Apellidos *</label>
                <input
                  type="text"
                  name="apellidos"
                  className="form-control"
                  value={formulario.apellidos}
                  onChange={actualizarCampo}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Región policial *
                </label>
                <select
                  name="regionId"
                  className="form-select"
                  value={formulario.regionId}
                  onChange={actualizarCampo}
                  required
                >
                  <option value="">Seleccionar región</option>
                  {regiones.map((region) => (
                    <option key={region.id} value={region.id}>
                      {nombreRegion(region.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Dependencia</label>
                <input
                  type="text"
                  name="dependencia"
                  className="form-control"
                  value={formulario.dependencia}
                  onChange={actualizarCampo}
                  placeholder="Unidad o dependencia policial"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Cargo</label>
                <input
                  type="text"
                  name="cargo"
                  className="form-control"
                  value={formulario.cargo}
                  onChange={actualizarCampo}
                  placeholder="Cargo o función"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Estado</label>
                <select
                  name="estado"
                  className="form-select"
                  value={formulario.estado}
                  onChange={actualizarCampo}
                >
                  <option value="Activo">Activo</option>
                  <option value="Disponibilidad">Disponibilidad</option>
                  <option value="Retiro">Retiro</option>
                </select>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : editandoId !== null
                  ? "Guardar cambios"
                  : "Registrar personal"}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={limpiarFormulario}
              >
                Limpiar formulario
              </button>
            </div>

            <p className="text-secondary small mt-3 mb-0">
              * Campos obligatorios. Utiliza datos autorizados para las
              pruebas y evita ingresar información personal real sin
              las medidas de protección correspondientes.
            </p>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0">
            Listado de personal policial
          </h5>
        </div>

        <div className="card-body">
          <div className="row g-3 mb-3">
            <div className="col-md-8">
              <label className="form-label">Buscar personal</label>
              <input
                type="search"
                className="form-control"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="DNI, nombres, apellidos, grado o dependencia"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Filtrar por región</label>
              <select
                className="form-select"
                value={filtroRegion}
                onChange={(e) => setFiltroRegion(e.target.value)}
              >
                <option value="todas">Todas las regiones</option>
                {regiones.map((region) => (
                  <option key={region.id} value={region.id}>
                    {nombreRegion(region.id)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {cargando ? (
            <p className="text-secondary">
              Cargando información...
            </p>
          ) : personalFiltrado.length === 0 ? (
            <div className="alert alert-info mb-0">
              No hay registros que mostrar. Puedes registrar personal
              usando el formulario superior.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>DNI</th>
                    <th>Grado</th>
                    <th>Apellidos y nombres</th>
                    <th>Región</th>
                    <th>Dependencia</th>
                    <th>Cargo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {personalFiltrado.map((persona) => (
                    <tr key={persona.id}>
                      <td>{persona.dni}</td>
                      <td>{persona.grado}</td>
                      <td>
                        {persona.apellidos}, {persona.nombres}
                      </td>
                      <td>{nombreRegion(persona.regionId)}</td>
                      <td>{persona.dependencia || "—"}</td>
                      <td>{persona.cargo || "—"}</td>
                      <td>
                        <span
                          className={`badge ${
                            persona.estado === "Activo"
                              ? "text-bg-success"
                              : "text-bg-secondary"
                          }`}
                        >
                          {persona.estado || "Sin estado"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => editarPersonal(persona)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminarPersonal(persona)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-secondary small mb-0 mt-3">
            Mostrando {personalFiltrado.length} de {personal.length} registros.
          </p>
        </div>
      </div>
    </main>
  );
}

export default Personal;
