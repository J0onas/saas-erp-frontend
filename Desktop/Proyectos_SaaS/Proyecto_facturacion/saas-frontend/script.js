const fs = require('fs');
const path = require('path');

const pages = ['dashboard', 'productos', 'historial', 'reportes', 'configuracion', 'usuarios', 'proveedores'];
const basePath = 'c:\\Users\\user\\Desktop\\Proyectos_SaaS\\Proyecto_facturacion\\saas-frontend\\app';

pages.forEach(p => {
    const file = path.join(basePath, p, 'page.tsx');
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // Add import
        if (!content.includes('import PageWrapper')) {
            content = content.replace(/(import Navbar.+)/, "$1\nimport PageWrapper from '../components/PageWrapper';");
        }
        
        // Remove min-h-screen from the outer div block
        content = content.replace(/<div className="min-h-screen bg-slate-50">/g, '<div className="bg-slate-50">');
        
        // Add <PageWrapper> after Navbar
        if (!content.includes('<PageWrapper>')) {
            content = content.replace(/(<Navbar[\s\S]*?(?:\/>|<\/Navbar>))\s+(<div className="max-w-7xl(?:[^"]*)">)/, "$1\n      <PageWrapper>\n      $2");
            
            // Add </PageWrapper> before the closing </div> of the main page wrapper
            // This is tricky, a better way is to find the last </div> before modals.
            // But we know Dashboard already has <PageWrapper> so we just need to fix its lack of closing tag and import.
        }
        
        fs.writeFileSync(file, content);
    }
});
