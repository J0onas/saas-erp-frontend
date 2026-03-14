'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as TooltipBar, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as TooltipPie, Legend, AreaChart, Area
} from 'recharts';

export default function ReportesPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  // Paleta de colores Enterprise basada en tus preferencias
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  useEffect(() => {
    const fetchMetrics = async () => {
      const token = localStorage.getItem('saas_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/reports/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
        });
        const data = await response.json();
        
        if (data.success) {
          setMetrics(data.data);
        }
      } catch (error) {
        console.error("Error cargando métricas:", error);
      } finally {
        setCargando(false);
      }
    };

    fetchMetrics();
  }, [router]);

  // --- GENERADOR DE REPORTE CONTABLE (SIRE) ---
  const descargarReporteSIRE = async () => {
    const token = localStorage.getItem('saas_token');
    const today = new Date();
    const month = today.getMonth() + 1; // Mes actual
    const year = today.getFullYear();   // Año actual

    try {
      // 1. Llamamos a tu nuevo endpoint (Asegúrate de tener esta ruta en tu controlador NestJS)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/reports/sire/${year}/${month}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await response.json();

      if (!data.success || data.data.length === 0) {
        alert('No hay ventas registradas en este mes para exportar.');
        return;
      }

      // 2. Construimos el CSV (Formato amigable para Excel)
      const cabeceras = ['Fecha Emision', 'Tipo Comp.', 'Serie', 'Correlativo', 'Tipo Doc. Cliente', 'Num. Doc. Cliente', 'Razon Social', 'Base Imponible', 'IGV', 'Total', 'Estado SUNAT'];
      
      const filasCSV = data.data.map((fila: any) => [
        fila.fecha_emision,
        fila.tipo_comprobante,
        fila.serie,
        fila.correlativo,
        fila.tipo_doc_cliente,
        fila.numero_doc_cliente,
        `"${fila.razon_social}"`, // Entre comillas por si el nombre tiene comas
        fila.base_imponible,
        fila.igv,
        fila.importe_total,
        fila.estado_sunat
      ]);

      const contenidoCSV = [cabeceras.join(','), ...filasCSV.map((f: any[]) => f.join(','))].join('\n');

      // 3. Forzar la descarga en el navegador
      const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Registro_Ventas_SIRE_${year}_${month}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error al exportar:", error);
      alert('Error descargando el reporte.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Centro de Mando</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Análisis de rendimiento y salud financiera de tu negocio.</p>
          </div>
          <div className="flex gap-4">
            {/* NUEVO BOTÓN CONTABLE */}
            <button 
              onClick={descargarReporteSIRE}
              className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all focus:ring-2 focus:ring-emerald-200 outline-none"
            >
              <span className="mr-2">📥</span> Exportar SIRE
            </button>

            <Link href="/dashboard" className="inline-flex items-center justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all focus:ring-2 focus:ring-slate-200 outline-none">
              <span className="mr-2">←</span> Volver al POS
            </Link>
          </div>
        </div>

        

        {cargando ? (
           <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-slate-200">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600 mb-4"></div>
             <p className="text-slate-500 font-medium animate-pulse">Procesando inteligencia de negocios...</p>
           </div>
        ) : metrics ? (
          <>
            {/* KPI WIDGETS (3 Columnas) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ingresos Totales</p>
                    <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">💰</span>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tight">
                    S/ {Number(metrics.kpis.total_revenue).toFixed(2)}
                  </h3>
                </div>
                <div className="mt-4 text-sm font-medium text-emerald-600 flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                   Actualizado en tiempo real
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Operaciones Exitosas</p>
                    <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">🧾</span>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tight">
                    {metrics.kpis.total_invoices} <span className="text-xl text-slate-400 font-medium">ventas</span>
                  </h3>
                </div>
                <div className="mt-4 text-sm font-medium text-slate-400">
                   Comprobantes emitidos a SUNAT
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ticket Promedio</p>
                    <span className="p-2 bg-purple-100 text-purple-600 rounded-lg">📈</span>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tight">
                    S/ {Number(metrics.kpis.average_ticket).toFixed(2)}
                  </h3>
                </div>
                <div className="mt-4 text-sm font-medium text-slate-400">
                   Gasto promedio por cliente
                </div>
              </div>

            </div>

            {/* MAIN CHARTS (Grid asimétrica 2/3 y 1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Gráfico de Tendencia (Área) - Ocupa 2 columnas */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-extrabold text-slate-800">Curva de Ingresos (Últimos 7 días)</h3>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {/* Cambiamos BarChart por AreaChart para un look más moderno */}
                    <AreaChart data={metrics.lastDays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} tickFormatter={(value) => `S/${value}`} />
                      <TooltipBar 
                        cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}}
                        contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                        formatter={(value) => [`S/ ${Number(value).toFixed(2)}`, 'Ventas del Día']}
                        labelStyle={{fontWeight: 'bold', color: '#334155', marginBottom: '4px'}}
                      />
                      <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" activeDot={{r: 6, strokeWidth: 0}} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Pastel - Ocupa 1 columna */}
              <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <h3 className="text-lg font-extrabold text-slate-800 mb-2">Canales de Pago</h3>
                <p className="text-sm text-slate-500 mb-6">Distribución de ingresos por método.</p>
                <div className="flex-grow h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.paymentMethods}
                        cx="50%" cy="45%"
                        innerRadius={70} outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {metrics.paymentMethods.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <TooltipPie 
                        formatter={(value) => `S/ ${Number(value).toFixed(2)}`}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 600, color: '#475569'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* SECCIÓN INFERIOR: RANKINGS */}
            <div className="grid grid-cols-1 gap-6">
              
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-800">Top 5 Productos Estrella</h3>
                      <p className="text-sm text-slate-500 font-medium">Los artículos que generan más valor al negocio.</p>
                    </div>
                    <span className="text-2xl">🏆</span>
                 </div>
                 
                 <div className="p-0">
                   {metrics.topProducts && metrics.topProducts.length > 0 ? (
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-white text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                           <th className="px-6 py-4 font-bold">#</th>
                           <th className="px-6 py-4 font-bold">Producto / Servicio</th>
                           <th className="px-6 py-4 font-bold text-center">Unidades Vendidas</th>
                           <th className="px-6 py-4 font-bold text-right">Ingreso Generado</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {metrics.topProducts.map((prod: any, idx: number) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-colors">
                             <td className="px-6 py-4">
                               <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-800' : 'text-slate-400'}`}>
                                 {idx + 1}
                               </span>
                             </td>
                             <td className="px-6 py-4 font-bold text-slate-800">{prod.name}</td>
                             <td className="px-6 py-4 text-center font-medium text-slate-600">{prod.sold} un.</td>
                             <td className="px-6 py-4 text-right font-black text-emerald-600">S/ {prod.revenue.toFixed(2)}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   ) : (
                     <div className="p-8 text-center text-slate-500 font-medium">No hay suficientes datos de ventas para generar el ranking.</div>
                   )}
                 </div>
              </div>

            </div>

          </>
        ) : (
          <div className="p-12 text-center bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-600 font-bold text-lg">Error crítico al cargar los datos.</p>
            <p className="text-red-500 text-sm mt-2">Por favor, contacta a soporte técnico.</p>
          </div>
        )}

      </div>
    </div>
  );
}