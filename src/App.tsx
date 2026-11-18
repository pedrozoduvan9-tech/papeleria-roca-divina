import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";

// Configuración de Firebase para Papelería Roca Divina
const firebaseConfig = {
  apiKey: "AIzaSyBlDeaI-WA7vQn4PsStuMDfR7VOtKsOaZ8",
  authDomain: "papeleria-roca-divina.firebaseapp.com",
  projectId: "papeleria-roca-divina",
  storageBucket: "papeleria-roca-divina.firebasestorage.app",
  messagingSenderId: "920249252990",
  appId: "1:920249252990:web:6c8ca870e7c73b43e2ec2f",
  measurementId: "G-7Z7ZG811GE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [auth, setAuth] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("dash");

  const [comp, setComp] = useState({
    name: "Papelería Roca Divina",
    nit: "26996762-2",
    address: "Calle 18 # 15 35, Barrio San José, Fonseca",
    phone: "3014849240",
    email: "papeleriarocadivina@gmail.com",
    logo: ""
  });

  const [inv, setInv] = useState([
    { id: "001", name: "Cuaderno", cost: 2500, price: 4500, stock: 14, sold: 42, image: "" },
    { id: "002", name: "Borrador", cost: 300, price: 600, stock: 30, sold: 0, image: "" }
  ]);

  const [terceros, setTerceros] = useState([
    { id: "CC-123456", name: "Cliente General", phone: "3000000000", address: "Ciudad", email: "general@email.com" }
  ]);

  const [users, setUsers] = useState([{ name: "Admin", pin: "2020" }]);
  const [docs, setDocs] = useState([]);
  const [cash, setCash] = useState({ isOpen: false, base: 0, exp: [] });
  const [num, setNum] = useState(1001);

  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [newClient, setNewClient] = useState({ id: "", name: "", phone: "", address: "", email: "" });

  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [iq, setIq] = useState("");
  const [expD, setExpD] = useState("");
  const [expV, setExpV] = useState("");
  const [baseI, setBaseI] = useState("");
  const [rDoc, setRDoc] = useState("");
  const [rCode, setRCode] = useState("");
  const [rQty, setRQty] = useState(1);
  const [newProd, setNewProd] = useState({ id: "", name: "", cost: "", price: "", stock: "", image: "" });
  
  // Estado para edición directa de producto en el software
  const [editingProd, setEditingProd] = useState(null);

  const [newU, setNewU] = useState({ name: "", pin: "" });

  // Cargar datos desde Firestore al iniciar
  useEffect(() => {
    async function fetchData() {
      try {
        const querySnapshot = await getDocs(collection(db, "papeleria"));
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (docSnap.id === "config") setComp(data);
          if (docSnap.id === "inventario") setInv(data.items);
          if (docSnap.id === "terceros") setTerceros(data.items);
          if (docSnap.id === "documentos") setDocs(data.items);
          if (docSnap.id === "caja") setCash(data);
          if (docSnap.id === "secuencia") setNum(data.num);
        });
      } catch (e) {
        console.error("Error cargando de Firebase:", e);
      }
    }
    fetchData();
  }, []);

  // Guardar automáticamente en Firebase al cambiar los estados
  useEffect(() => {
    async function saveData() {
      try {
        await setDoc(doc(db, "papeleria", "config"), comp);
        await setDoc(doc(db, "papeleria", "inventario"), { items: inv });
        await setDoc(doc(db, "papeleria", "terceros"), { items: terceros });
        await setDoc(doc(db, "papeleria", "documentos"), { items: docs });
        await setDoc(doc(db, "papeleria", "caja"), cash);
        await setDoc(doc(db, "papeleria", "secuencia"), { num });
      } catch (e) {
        console.error("Error guardando en Firebase:", e);
      }
    }
    saveData();
  }, [comp, inv, terceros, docs, cash, num]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setComp(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. Plantilla 1: Plantilla vacía para Migración Inicial
  const downloadMigrationTemplate = () => {
    const header = "Codigo,Nombre,Costo,Precio,Stock,URL_Imagen\n";
    const example = "001,Cuaderno Ejemplo,2500,4500,20,https://ejemplo.com/imagen.jpg\n";
    const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_migracion_inventario.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Plantilla 2: Descargar el inventario actual de la base de datos para editar
  const downloadCurrentInventory = () => {
    let csvContent = "Codigo,Nombre,Costo,Precio,Stock,URL_Imagen\n";
    inv.forEach(item => {
      csvContent += `${item.id},"${item.name}",${item.cost},${item.price},${item.stock},"${item.image || ''}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "inventario_actual_para_editar.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Subir y procesar cualquiera de las dos plantillas completadas
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      try {
        let count = 0;
        const rows = text.split("\n");
        const newItems = [...inv];

        rows.forEach((l, index) => {
          if (index === 0) return; // Omitir cabecera
          const line = l.trim();
          if (!line) return;
          // Manejo básico de campos separados por coma
          const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          const id = parts[0] ? parts[0].trim() : "";
          const name = parts[1] ? parts[1].replace(/"/g, '').trim() : "";
          const cost = Number(parts[2]) || 0;
          const price = Number(parts[3]) || 0;
          const stock = Number(parts[4]) || 0;
          const image = parts[5] ? parts[5].replace(/"/g, '').trim() : "";

          if (id && name) {
            const existingIndex = newItems.findIndex(item => item.id === id);
            const prodData = { id, name, cost, price, stock, sold: 0, image };
            if (existingIndex >= 0) {
              newItems[existingIndex] = { ...newItems[existingIndex], ...prodData };
            } else {
              newItems.push(prodData);
            }
            count++;
          }
        });

        setInv(newItems);
        alert(`¡Inventario actualizado con éxito! Se procesaron ${count} productos.`);
      } catch (err) {
        alert("Error al procesar el archivo CSV.");
      }
    };
    reader.readAsText(file);
  };

  const printInvoiceWindow = (docToPrint) => {
    const win = window.open('', '_blank');
    if (!win) return alert("Por favor permite las ventanas emergentes (pop-ups) para imprimir.");
    
    const isEfectivo = docToPrint.paymentMethod === "Efectivo";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Factura ${docToPrint.number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
            body { font-family: 'Poppins', sans-serif; padding: 20px; color: #0f172a; background: #fff; }
            .invoice-box { max-width: 800px; margin: 0 auto; padding: 25px; border: 2.5px solid #5b21b6; border-radius: 14px; background: white; box-shadow: 0 4px 15px rgba(91,33,182,0.1); }
            .header-table { width: 100%; border-collapse: collapse; border-bottom: 2.5px solid #5b21b6; padding-bottom: 15px; margin-bottom: 15px; }
            .title-box { border: 2px solid #5b21b6; border-radius: 10px; padding: 10px 15px; text-align: center; background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%); color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .client-box { margin-bottom: 15px; padding: 14px; background: #faf5ff; border-radius: 8px; border: 2px solid #5b21b6; font-size: 13px; }
            table.items-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 15px; border: 2.5px solid #5b21b6; border-radius: 6px; overflow: hidden; }
            table.items-table th { background: #5b21b6; color: white; padding: 10px 8px; border: 1px solid #5b21b6; text-align: center; font-weight: 600; letter-spacing: 0.5px; }
            table.items-table td { padding: 9px 8px; border: 1px solid #d8b4fe; }
            .footer-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; align-items: flex-start; }
            .payment-box { border: 2px solid #5b21b6; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: #faf5ff; }
            .obs-box { border: 2px solid #5b21b6; border-radius: 8px; padding: 12px; min-height: 50px; background: #faf5ff; }
            .totals-box { border: 2px solid #5b21b6; border-radius: 8px; overflow: hidden; }
            .total-row { display: flex; justify-content: space-between; padding: 7px 12px; border-bottom: 1px solid #d8b4fe; font-size: 13px; background: #faf5ff; }
            .total-final { display: flex; justify-content: space-between; padding: 10px 12px; background: #5b21b6; color: white; font-size: 15px; font-weight: bold; letter-spacing: 0.5px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            
            <table class="header-table">
              <tr>
                <td style="border: none; width: 42%; vertical-align: middle; text-align: center;">
                  ${comp.logo ? `<img src="${comp.logo}" style="max-width: 100%; max-height: 180px; width: auto; object-fit: contain; border-radius: 8px;" alt="Logo" />` : `<div style="border: 2px dashed #5b21b6; padding: 20px; color: #5b21b6; font-size: 12px; font-weight: bold;">Sube tu logo en Configuración</div>`}
                </td>
                <td style="border: none; width: 58%; vertical-align: middle; padding-left: 20px;">
                  <div class="title-box">
                    <h2 style="margin: 0; font-size: 21px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;">FACTURA DE VENTA</h2>
                    <p style="margin: 5px 0 0 0; font-size: 17px; font-weight: 600;">Nº ${docToPrint.number}</p>
                  </div>
                  <div style="margin-top: 12px; font-size: 11.5px; color: #334155; line-height: 1.5;">
                    <p style="margin: 2px 0;"><strong>NIT:</strong> ${comp.nit}</p>
                    <p style="margin: 2px 0;">📍 ${comp.address}</p>
                    <p style="margin: 2px 0;">✉️ ${comp.email}</p>
                    <p style="margin: 2px 0;">📞 Tel: ${comp.phone}</p>
                  </div>
                </td>
              </tr>
            </table>

            <div class="client-box">
              <table style="width: 100%; border: none; font-size: 13px;">
                <tr>
                  <td style="border: none; padding: 3px 0;" colspan="2"><strong>Cliente:</strong> ${docToPrint.client ? docToPrint.client.name : 'Consumidor Final'}</td>
                  <td style="border: none; padding: 3px 0;"><strong>Fecha de factura:</strong> ${docToPrint.date}</td>
                </tr>
                <tr>
                  <td style="border: none; padding: 3px 0;" colspan="2"><strong>C.C. o NIT:</strong> ${docToPrint.client ? docToPrint.client.id : 'N/A'}</td>
                  <td style="border: none; padding: 3px 0;"><strong>Teléfono:</strong> ${docToPrint.client ? docToPrint.client.phone : 'N/A'}</td>
                </tr>
                <tr>
                  <td style="border: none; padding: 3px 0;" colspan="3"><strong>Dirección:</strong> ${docToPrint.client ? docToPrint.client.address : 'N/A'}</td>
                </tr>
              </table>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 40px; border-right: 1px solid #7c3aed;">No.</th>
                  <th style="border-right: 1px solid #7c3aed; text-align: left; padding-left: 10px;">Descripción del producto o servicio</th>
                  <th style="width: 60px; border-right: 1px solid #7c3aed;">Cant.</th>
                  <th style="width: 90px; text-align: right; border-right: 1px solid #7c3aed; padding-right: 10px;">Vr. Unitario</th>
                  <th style="width: 100px; text-align: right; padding-right: 10px;">Vr. Total</th>
                </tr>
              </thead>
              <tbody>
                ${docToPrint.items.map((it, idx) => `
                  <tr>
                    <td style="text-align: center; border-right: 1px solid #d8b4fe; font-weight: 500;">${idx + 1}</td>
                    <td style="border-right: 1px solid #d8b4fe; padding-left: 10px;">${it.name || it.id}</td>
                    <td style="text-align: center; border-right: 1px solid #d8b4fe;">${it.qty}</td>
                    <td style="text-align: right; border-right: 1px solid #d8b4fe; padding-right: 10px;">$${it.price || 0}</td>
                    <td style="text-align: right; padding-right: 10px; font-weight: 600;">$${(it.price || 0) * (it.qty || 1)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer-grid">
              <div>
                <div class="payment-box">
                  <p style="margin: 0 0 6px 0; font-size: 11.5px; font-weight: bold; color: #5b21b6; text-transform: uppercase;">FORMA DE PAGO</p>
                  <div style="font-size: 13px; display: flex; gap: 20px; font-weight: 500;">
                    <span>${isEfectivo ? '☒' : '☐'} Efectivo</span>
                    <span>${!isEfectivo ? '☒' : '☐'} Transferencia</span>
                  </div>
                </div>
                <div class="obs-box">
                  <p style="margin: 0 0 3px 0; font-size: 11.5px; font-weight: bold; color: #5b21b6; text-transform: uppercase;">Observaciones:</p>
                  <p style="margin: 0; font-size: 11px; color: #64748b;">Ninguna.</p>
                </div>
              </div>

              <div class="totals-box">
                <div class="total-row"><span>SUBTOTAL:</span><strong>$${docToPrint.total}</strong></div>
                <div class="total-row"><span>DESCUENTO:</span><strong>$0</strong></div>
                <div class="total-row"><span>IVA:</span><strong>$0</strong></div>
                <div class="total-final"><span>TOTAL A PAGAR:</span><span>$${docToPrint.total}</span></div>
              </div>
            </div>

            <div style="text-align: center; margin-top: 25px; border-top: 2.5px dashed #5b21b6; padding-top: 10px;">
              <p style="margin: 0; font-style: italic; color: #db2777; font-size: 16px; font-weight: bold;">¡Gracias por su compra!</p>
            </div>

          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;
    win.document.write(htmlContent);
    win.document.close();
  };

  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#1e293b', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px', color: 'white' }}>
          <h2 style={{ textAlign: 'center' }}>{comp.name}</h2>
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>PIN de Acceso (Admin: 2020)</p>
          <form onSubmit={e => { e.preventDefault(); if (users.some(u => u.pin === pin) || pin === "2020") setAuth(true); else setError(true); }}>
            <input type="password" maxLength={6} value={pin} onChange={e => setPin(e.target.value)} placeholder="••••" style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', color: 'white', textAlign: 'center', fontSize: '24px', letterSpacing: '8px', marginBottom: '16px', boxSizing: 'border-box' }} autoFocus />
            {error && <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center' }}>PIN incorrecto</p>}
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  const salesTot = docs.filter(d => d.type === 'Venta').reduce((a, c) => a + c.total, 0);
  const expTot = cash.exp.reduce((a, c) => a + c.val, 0);
  const expected = cash.base + salesTot - expTot;
  const bestSellers = [...inv].sort((a, b) => (b.sold || 0) - (a.sold || 0));
  const unSoldItems = inv.filter(i => (i.sold || 0) === 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <div className="no-print" style={{ width: '250px', background: '#0f172a', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h3>{comp.name}</h3>
        <div style={{ margin: '15px 0', padding: '6px', background: cash.isOpen ? '#065f46' : '#991b1b', textAlign: 'center', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
          {cash.isOpen ? 'Caja Abierta' : 'Caja Cerrada'}
        </div>
        <button onClick={() => setTab("dash")} style={btnNav(tab === "dash")}>Dashboard</button>
        <button onClick={() => setTab("cash")} style={btnNav(tab === "cash")}>Control de Caja</button>
        <button onClick={() => setTab("pos")} style={btnNav(tab === "pos")}>Punto de Venta</button>
        <button onClick={() => setTab("terceros")} style={btnNav(tab === "terceros")}>Terceros (Clientes)</button>
        <button onClick={() => setTab("inv")} style={btnNav(tab === "inv")}>Inventario</button>
        <button onClick={() => setTab("ret")} style={btnNav(tab === "ret")}>Devoluciones</button>
        <button onClick={() => setTab("docs")} style={btnNav(tab === "docs")}>Buscador Documentos</button>
        <button onClick={() => setTab("rep")} style={btnNav(tab === "rep")}>Informes y Caja</button>
        <button onClick={() => setTab("set")} style={btnNav(tab === "set")}>Configuracion</button>
        <button onClick={() => setAuth(false)} style={{ marginTop: 'auto', padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
      </div>

      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {tab === "dash" && (
          <div>
            <h2>Dashboard Financiero</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
              <div style={box}><h3>Ventas Hoy</h3><p style={{ fontSize: '24px', color: '#16a34a', fontWeight: 'bold' }}>${salesTot}</p></div>
              <div style={box}><h3>Clientes Terceros</h3><p style={{ fontSize: '24px', color: '#2563eb', fontWeight: 'bold' }}>{terceros.length}</p></div>
              <div style={box}><h3>Caja Esperada</h3><p style={{ fontSize: '24px', color: '#2563eb', fontWeight: 'bold' }}>${expected}</p></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '25px' }}>
              <div style={box}>
                <h3>📊 Gráfica de Ventas (Más Vendidos)</h3>
                {bestSellers.slice(0, 4).map((p, i) => (
                  <div key={i} style={{ margin: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span>{p.name}</span><strong>{p.sold || 0} un.</strong></div>
                    <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', marginTop: '4px' }}>
                      <div style={{ width: `${Math.min(100, ((p.sold || 0) / 20) * 100)}%`, background: '#4f46e5', height: '100%', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={box}>
                <h3>📈 Flujo de Caja Dinámico</h3>
                <p style={{ fontSize: '14px', margin: '8px 0' }}>Base Inicial: <strong>${cash.base}</strong></p>
                <p style={{ fontSize: '14px', margin: '8px 0' }}>Ventas en Efectivo: <strong style={{ color: '#16a34a' }}>+${salesTot}</strong></p>
                <p style={{ fontSize: '14px', margin: '8px 0' }}>Gastos Totales: <strong style={{ color: '#ef4444' }}>-${expTot}</strong></p>
                <hr style={{ margin: '12px 0', border: '0', borderTop: '1px solid #e2e8f0' }} />
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563eb' }}>Total en Caja: ${expected}</p>
              </div>
            </div>
          </div>
        )}

        {tab === "cash" && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', maxWidth: '500px' }}>
            <h3>Control de Caja</h3>
            {!cash.isOpen ? (
              <div>
                <input type="number" placeholder="Base inicial" value={baseI} onChange={e => setBaseI(e.target.value)} style={inp} />
                <button onClick={() => { const b = Number(baseI); if (!isNaN(b)) setCash({ isOpen: true, base: b, exp: [] }); }} style={btnG}>Abrir Caja</button>
              </div>
            ) : (
              <div>
                <p>Base: ${cash.base} | Ventas: ${salesTot} | Gastos: ${expTot}</p>
                <p style={{ fontWeight: 'bold', color: '#2563eb' }}>En Caja: ${expected}</p>
                <h4 style={{ marginTop: '15px' }}>Registrar Gasto</h4>
                <input type="text" placeholder="Descripcion" value={expD} onChange={e => setExpD(e.target.value)} style={inp} />
                <input type="number" placeholder="Valor" value={expV} onChange={e => setExpV(e.target.value)} style={inp} />
                <button onClick={() => { if (expD && expV) setCash(c => ({ ...c, exp: [...c.exp, { desc: expD, val: Number(expV) }] })); setExpD(""); setExpV(""); }} style={btnO}>Agregar Gasto</button>
                <button onClick={() => setCash({ isOpen: false, base: 0, exp: [] })} style={btnR}>Cerrar Caja</button>
              </div>
            )}
          </div>
        )}

        {tab === "terceros" && (
          <div style={box}>
            <h3>Gestión de Terceros (Clientes)</h3>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', maxWidth: '500px', margin: '15px 0' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>➕ Crear Nuevo Cliente</h4>
              <input type="text" placeholder="Cédula o NIT" value={newClient.id} onChange={e => setNewClient({ ...newClient, id: e.target.value })} style={inp} />
              <input type="text" placeholder="Nombre completo o Razón Social" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} style={inp} />
              <input type="text" placeholder="Teléfono" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} style={inp} />
              <input type="text" placeholder="Dirección" value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} style={inp} />
              <input type="email" placeholder="Correo electrónico" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} style={inp} />
              <button onClick={() => {
                if (!newClient.id || !newClient.name) return alert("Ingrese al menos la cédula/NIT y el nombre");
                if (terceros.some(t => t.id === newClient.id)) return alert("Ya existe un cliente con esta cédula/NIT");
                setTerceros(prev => [...prev, newClient]);
                setNewClient({ id: "", name: "", phone: "", address: "", email: "" });
                alert("Cliente guardado en Terceros y en la nube con éxito.");
              }} style={btnG}>Guardar Cliente</button>
            </div>

            <h4 style={{ marginTop: '20px' }}>Lista de Clientes Registrados ({terceros.length})</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginTop: '10px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Cédula / NIT</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Nombre</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Teléfono</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Dirección</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Email</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {terceros.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{t.id}</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{t.name}</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{t.phone}</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{t.address}</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{t.email}</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      <button onClick={() => {
                        if (window.confirm(`¿Seguro que deseas eliminar al cliente ${t.name}?`)) {
                          setTerceros(prev => prev.filter(item => item.id !== t.id));
                        }
                      }} style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "pos" && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div style={box}>
              <h3>Punto de Venta</h3>
              <input type="text" placeholder="Buscar producto..." value={q} onChange={e => setQ(e.target.value)} style={inp} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
                {inv.filter(i => i.name.toLowerCase().includes(q.toLowerCase())).map(p => (
                  <div key={p.id} onClick={() => setCart(c => { const ex = c.find(x => x.id === p.id); return ex ? c.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x) : [...c, { ...p, qty: 1 }]; })} style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {p.image ? <img src={p.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} /> : <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>Sin foto</div>}
                    <div>
                      <strong>{p.name}</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Stock: {p.stock} | ${p.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...box, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3>FAC-{num}</h3>
                
                <div style={{ margin: '10px 0', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Buscar Cliente (Nombre o Cédula):</p>
                  <input 
                    type="text" 
                    placeholder="Escribe nombre o cédula..." 
                    value={clientSearch} 
                    onChange={e => {
                      const val = e.target.value;
                      setClientSearch(val);
                      const found = terceros.find(t => t.name.toLowerCase().includes(val.toLowerCase()) || t.id.toLowerCase().includes(val.toLowerCase()));
                      setSelectedClient(found || null);
                    }} 
                    style={{ ...inp, marginBottom: '5px' }} 
                  />

                  {selectedClient ? (
                    <div style={{ background: '#ecfdf5', padding: '6px', borderRadius: '4px', border: '1px solid #10b981', fontSize: '12px', color: '#065f46' }}>
                      ✅ <strong>{selectedClient.name}</strong> (C.C/NIT: {selectedClient.id})
                    </div>
                  ) : clientSearch.trim() !== "" ? (
                    <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '4px', border: '1px solid #ef4444', fontSize: '12px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 5px 0', color: '#991b1b', fontWeight: 'bold' }}>Cliente no encontrado</p>
                      <button 
                        onClick={() => {
                          setNewClient({ id: clientSearch, name: isNaN(clientSearch) ? clientSearch : "", phone: "", address: "", email: "" });
                          setTab("terceros");
                        }} 
                        style={{ padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ➕ Desea crearlo?
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>Se usará Consumidor General por defecto si no buscas uno.</p>
                  )}
                </div>

                <div style={{ margin: '10px 0', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Forma de Pago:</p>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>

                <div style={{ maxHeight: '130px', overflowY: 'auto' }}>
                  {cart.map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '5px 0' }}>
                      <span>{i.name} (x{i.qty})</span>
                      <span>${i.price * i.qty} <button onClick={() => setCart(c => c.filter(x => x.id !== i.id))} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>X</button></span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4>Total: ${cart.reduce((a, i) => a + (i.price * i.qty), 0)}</h4>
                <button onClick={() => {
                  if (!cash.isOpen) return alert("Caja cerrada");
                  if (cart.length === 0) return alert("Carrito vacio");
                  const clientToSave = selectedClient || terceros[0] || { id: "CC-000", name: "Consumidor Final", phone: "", address: "" };
                  const total = cart.reduce((a, i) => a + (i.price * i.qty), 0);
                  const newSaleDoc = { type: 'Venta', number: `FAC-${num}`, client: clientToSave, paymentMethod, items: [...cart], total, date: new Date().toLocaleString() };
                  setInv(prev => prev.map(i => { const s = cart.find(x => x.id === i.id); return s ? { ...i, stock: i.stock - s.qty, sold: (i.sold || 0) + s.qty } : i; }));
                  setDocs(d => [...d, newSaleDoc]);
                  setCart([]); setSelectedClient(null); setClientSearch(""); setNum(n => n + 1);
                  if (window.confirm("Venta exitosa y guardada en la nube. ¿Imprimir factura?")) {
                    printInvoiceWindow(newSaleDoc);
                  }
                }} style={btnG}>Cobrar e Imprimir</button>
              </div>
            </div>
          </div>
        )}

        {tab === "inv" && (
          <div style={box}>
            <h3>Gestión de Inventario y Plantillas CSV</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', margin: '15px 0' }}>
              
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <h4 style={{ margin: '0 0 5px 0' }}>1️⃣ Plantilla Migración</h4>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>Descarga la plantilla vacía para agregar productos nuevos.</p>
                <button onClick={downloadMigrationTemplate} style={{ ...btnB, width: '100%' }}>📥 Descargar Plantilla Vacía</button>
              </div>

              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <h4 style={{ margin: '0 0 5px 0' }}>2️⃣ Plantilla Actual</h4>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>Descarga tu inventario actual para editar precios, nombres o stock.</p>
                <button onClick={downloadCurrentInventory} style={{ ...btnO, width: '100%', marginTop: '0' }}>📥 Descargar Mi Inventario</button>
              </div>

              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <h4 style={{ margin: '0 0 5px 0' }}>3️⃣ Subir Plantilla Llena</h4>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>Sube tu archivo .csv editado para actualizar todo en la nube.</p>
                <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ ...inp, background: 'white', cursor: 'pointer', fontSize: '11px' }} />
              </div>

            </div>

            {/* Modal o Sección de Edición Directa de Producto */}
            {editingProd && (
              <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '8px', border: '2px solid #3b82f6', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>✏️ Editando Producto: {editingProd.name}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <input type="text" placeholder="Código SKU" value={editingProd.id} onChange={e => setEditingProd({ ...editingProd, id: e.target.value })} style={inp} />
                  <input type="text" placeholder="Nombre" value={editingProd.name} onChange={e => setEditingProd({ ...editingProd, name: e.target.value })} style={inp} />
                  <input type="number" placeholder="Costo" value={editingProd.cost} onChange={e => setEditingProd({ ...editingProd, cost: Number(e.target.value) })} style={inp} />
                  <input type="number" placeholder="Precio" value={editingProd.price} onChange={e => setEditingProd({ ...editingProd, price: Number(e.target.value) })} style={inp} />
                  <input type="number" placeholder="Stock" value={editingProd.stock} onChange={e => setEditingProd({ ...editingProd, stock: Number(e.target.value) })} style={inp} />
                  <input type="text" placeholder="URL de Imagen" value={editingProd.image} onChange={e => setEditingProd({ ...editingProd, image: e.target.value })} style={inp} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={() => {
                    setInv(prev => prev.map(item => item.id === editingProd.oldId ? editingProd : item));
                    setEditingProd(null);
                    alert("¡Producto actualizado con éxito!");
                  }} style={{ ...btnG, marginTop: '0' }}>Guardar Cambios</button>
                  <button onClick={() => setEditingProd(null)} style={{ ...btnR, marginTop: '0' }}>Cancelar</button>
                </div>
              </div>
            )}

            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>➕ Crear Producto Individual en el Software</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                <input type="text" placeholder="Código" value={newProd.id} onChange={e => setNewProd({ ...newProd, id: e.target.value })} style={{ ...inp, marginBottom: '0' }} />
                <input type="text" placeholder="Nombre" value={newProd.name} onChange={e => setNewProd({ ...newProd, name: e.target.value })} style={{ ...inp, marginBottom: '0' }} />
                <input type="number" placeholder="Costo" value={newProd.cost} onChange={e => setNewProd({ ...newProd, cost: e.target.value })} style={{ ...inp, marginBottom: '0' }} />
                <input type="number" placeholder="Precio" value={newProd.price} onChange={e => setNewProd({ ...newProd, price: e.target.value })} style={{ ...inp, marginBottom: '0' }} />
                <input type="number" placeholder="Stock" value={newProd.stock} onChange={e => setNewProd({ ...newProd, stock: e.target.value })} style={{ ...inp, marginBottom: '0' }} />
                <input type="text" placeholder="URL Imagen" value={newProd.image} onChange={e => setNewProd({ ...newProd, image: e.target.value })} style={{ ...inp, marginBottom: '0' }} />
              </div>
              <button onClick={() => {
                if (!newProd.id || !newProd.name) return alert("Completa al menos el código y el nombre");
                setInv(prev => [...prev, { id: newProd.id, name: newProd.name, cost: Number(newProd.cost) || 0, price: Number(newProd.price) || 0, stock: Number(newProd.stock) || 0, sold: 0, image: newProd.image }]);
                setNewProd({ id: "", name: "", cost: "", price: "", stock: "", image: "" });
                alert("Producto creado con éxito.");
              }} style={{ ...btnG, marginTop: '10px' }}>Guardar Producto Individual</button>
            </div>

            <input type="text" placeholder="Buscar en inventario..." value={iq} onChange={e => setIq(e.target.value)} style={{ ...inp, marginTop: '10px' }} />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginTop: '10px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Imagen</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Codigo</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Nombre</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Costo</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Precio</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Stock</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inv.filter(i => i.name.toLowerCase().includes(iq.toLowerCase()) || i.id.includes(iq)).map(i => (
                  <tr key={i.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      {i.image ? <img src={i.image} alt="" style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '4px' }} /> : '—'}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{i.id}</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{i.name}</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>${i.cost}</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>${i.price}</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{i.stock}</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                      <button onClick={() => setEditingProd({ ...i, oldId: i.id })} style={{ padding: '4px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>✏️ Editar</button>
                      <button onClick={() => {
                        if (window.confirm(`¿Seguro que deseas eliminar el producto ${i.name}?`)) {
                          setInv(prev => prev.filter(item => item.id !== i.id));
                        }
                      }} style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "ret" && (
          <div style={{ ...box, maxWidth: '500px' }}>
            <h3>Devoluciones</h3>
            <input type="text" placeholder="Numero de Factura" value={rDoc} onChange={e => setRDoc(e.target.value)} style={inp} />
            <input type="text" placeholder="Codigo de Producto (SKU)" value={rCode} onChange={e => setRCode(e.target.value)} style={inp} />
            <input type="number" placeholder="Cantidad" value={rQty} onChange={e => setRQty(e.target.value)} style={inp} />
            <button onClick={() => {
              if (!rDoc || !rCode) return alert("Complete los datos");
              setInv(prev => prev.map(i => i.id === rCode ? { ...i, stock: i.stock + Number(rQty) } : i));
              setDocs(d => [...d, { type: 'Devolucion', number: `DEV-${rDoc}`, items: [{ id: rCode, qty: rQty }], total: 0, date: new Date().toLocaleString() }]);
              alert("Devolucion procesada"); setRDoc(""); setRCode(""); setRQty(1);
            }} style={btnO}>Procesar Devolucion</button>
          </div>
        )}

        {tab === "docs" && (
          <div style={box}>
            <h3>Buscador de Documentos y Facturas</h3>
            <input type="text" placeholder="Buscar por numero o cliente..." value={dq} onChange={e => setDq(e.target.value)} style={inp} />
            <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead><tr style={{ background: '#f1f5f9' }}><th style={{ padding: '8px' }}>Tipo</th><th style={{ padding: '8px' }}>Numero</th><th style={{ padding: '8px' }}>Cliente</th><th style={{ padding: '8px' }}>Fecha</th><th style={{ padding: '8px' }}>Total</th><th style={{ padding: '8px' }}>Accion</th></tr></thead>
              <tbody>
                {docs.filter(d => d.number.toLowerCase().includes(dq.toLowerCase()) || (d.client && d.client.name.toLowerCase().includes(dq.toLowerCase()))).map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px' }}>{d.type}</td>
                    <td style={{ padding: '8px' }}>{d.number}</td>
                    <td style={{ padding: '8px' }}>{d.client ? d.client.name : 'General'}</td>
                    <td style={{ padding: '8px' }}>{d.date}</td>
                    <td style={{ padding: '8px' }}>${d.total}</td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => printInvoiceWindow(d)} style={{ padding: '4px 8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Imprimir Factura</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "rep" && (
          <div style={box}>
            <h3>Informes del Negocio y Movimientos de Caja</h3>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0 }}>📊 Informe General (Ventas, Stock, Más y Menos Vendidos)</h4>
                <button onClick={() => {
                  const win = window.open('', '_blank');
                  win.document.write(`<html><head><title>Reporte General</title></head><body><h2>${comp.name} - Reporte General</h2>` + document.getElementById('print-report').innerHTML + `</body></html>`);
                  win.document.close();
                  win.print();
                }} style={btnB}>🖨️ Imprimir este Informe</button>
              </div>

              <div id="print-report" style={{ background: 'white', padding: '15px', borderRadius: '6px', marginTop: '10px' }}>
                <h3 style={{ textAlign: 'center', margin: 0 }}>{comp.name} - Reporte General</h3>
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>Fecha: {new Date().toLocaleString()}</p>

                <h5 style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginTop: '15px' }}>🔥 Productos Más Vendidos</h5>
                <ul>
                  {bestSellers.filter(i => (i.sold || 0) > 0).map((p, i) => <li key={i}>{p.name} - <strong>{p.sold} un. vendidas</strong></li>)}
                </ul>

                <h5 style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginTop: '15px' }}>❄️ Productos No Vendidos (Sin Movimiento)</h5>
                <ul>
                  {unSoldItems.length > 0 ? unSoldItems.map((p, i) => <li key={i}>{p.name} (Stock actual: {p.stock})</li>) : <li>Todos los productos tienen ventas registradas.</li>}
                </ul>

                <h5 style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginTop: '15px' }}>📦 Estado del Stock Actual</h5>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginTop: '5px' }}>
                  <thead><tr style={{ background: '#f1f5f9' }}><th style={{ border: '1px solid #cbd5e1', padding: '4px' }}>Producto</th><th style={{ border: '1px solid #cbd5e1', padding: '4px' }}>Stock</th><th style={{ border: '1px solid #cbd5e1', padding: '4px' }}>Precio</th></tr></thead>
                  <tbody>
                    {inv.map((p, i) => (
                      <tr key={i}><td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{p.name}</td><td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>{p.stock}</td><td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right' }}>${p.price}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0 }}>💰 Informe Exclusivo de Movimientos de Caja</h4>
                <button onClick={() => {
                  const win = window.open('', '_blank');
                  win.document.write(`<html><head><title>Reporte de Caja</title></head><body><h2>${comp.name} - Reporte de Caja</h2>` + document.getElementById('print-cash').innerHTML + `</body></html>`);
                  win.document.close();
                  win.print();
                }} style={btnB}>🖨️ Imprimir Movimientos de Caja</button>
              </div>

              <div id="print-cash" style={{ background: 'white', padding: '15px', borderRadius: '6px', marginTop: '10px' }}>
                <h3 style={{ textAlign: 'center', margin: 0 }}>{comp.name} - Reporte de Caja</h3>
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>Fecha: {new Date().toLocaleString()}</p>

                <p style={{ marginTop: '10px' }}>Base inicial con la que empezó: <strong>${cash.base}</strong></p>
                <p>Ventas totales en efectivo: <strong style={{ color: '#16a34a' }}>+${salesTot}</strong></p>
                <p>Gastos realizados:</p>
                <ul style={{ margin: '5px 0' }}>
                  {cash.exp.length > 0 ? cash.exp.map((e, idx) => <li key={idx}>{e.desc}: <span style={{ color: '#ef4444' }}>-${e.val}</span></li>) : <li>No hay gastos registrados.</li>}
                </ul>
                <p style={{ fontWeight: 'bold', color: '#2563eb', marginTop: '10px', fontSize: '15px' }}>Efectivo Total en Caja Esperado: ${expected}</p>
              </div>
            </div>

          </div>
        )}

        {tab === "set" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={box}>
              <h3>Configuracion de Empresa</h3>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Nombre de la empresa</label>
              <input type="text" value={comp.name} onChange={e => setComp({ ...comp, name: e.target.value })} placeholder="Nombre de la empresa" style={inp} />
              
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>NIT</label>
              <input type="text" value={comp.nit} onChange={e => setComp({ ...comp, nit: e.target.value })} placeholder="NIT" style={inp} />
              
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Dirección</label>
              <input type="text" value={comp.address} onChange={e => setComp({ ...comp, address: e.target.value })} placeholder="Direccion" style={inp} />
              
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Teléfono</label>
              <input type="text" value={comp.phone} onChange={e => setComp({ ...comp, phone: e.target.value })} placeholder="Telefono" style={inp} />
              
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Correo electrónico</label>
              <input type="email" value={comp.email || ""} onChange={e => setComp({ ...comp, email: e.target.value })} placeholder="Correo electrónico" style={inp} />
              
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Cargar Logo de la Empresa (Imagen)</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ ...inp, background: '#f8fafc', cursor: 'pointer' }} />
              
              {comp.logo && (
                <div style={{ marginTop: '5px', textAlign: 'center', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <p style={{ fontSize: '11px', margin: '0 0 5px 0', color: '#64748b' }}>Logo Actual Cargado:</p>
                  <img src={comp.logo} alt="Logo Preview" style={{ maxHeight: '90px', objectFit: 'contain' }} />
                  <br />
                  <button onClick={() => setComp({ ...comp, logo: "" })} style={{ marginTop: '8px', padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Quitar Logo</button>
                </div>
              )}
            </div>

            <div style={box}>
              <h3>Gestion de Usuarios y PIN</h3>
              <input type="text" placeholder="Nombre usuario" value={newU.name} onChange={e => setNewU({ ...newU, name: e.target.value })} style={inp} />
              <input type="password" placeholder="PIN (ej: 1234)" maxLength={6} value={newU.pin} onChange={e => setNewU({ ...newU, pin: e.target.value })} style={inp} />
              <button onClick={() => { if (!newU.name || !newU.pin) return alert("Complete los datos"); setUsers(u => [...u, newU]); setNewU({ name: "", pin: "" }); alert("Usuario creado"); }} style={btnB}>Crear Usuario</button>
              <h4 style={{ marginTop: '15px', fontSize: '14px' }}>Usuarios Activos:</h4>
              {users.map((u, i) => <p key={i} style={{ fontSize: '13px' }}>👤 {u.name} (PIN: {u.pin})</p>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnNav = (active) => ({ width: '100%', padding: '10px', background: active ? '#4f46e5' : 'transparent', color: 'white', border: 'none', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', marginBottom: '6px', fontWeight: '500' });
const box = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const inp = { width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', marginBottom: '10px', fontSize: '13px' };
const btnG = { width: '100%', padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };
const btnO = { width: '100%', padding: '10px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };
const btnR = { width: '100%', padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };
const btnB = { padding: '8px 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };