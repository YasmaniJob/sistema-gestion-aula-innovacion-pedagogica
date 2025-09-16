// Script de diagnóstico para problemas de sincronización de datos
// Ejecutar en la consola del navegador: fetch('/debug-sync.js').then(r => r.text()).then(eval)

(function() {
  console.log('🔍 Iniciando diagnóstico de sincronización de datos...');
  
  // Función para verificar APIs
  async function checkAPIs() {
    const endpoints = [
      '/api/users',
      '/api/resources', 
      '/api/loans',
      '/api/reservations',
      '/api/meetings',
      '/api/categories',
      '/api/areas',
      '/api/grades'
    ];
    
    console.log('📡 Verificando endpoints de API...');
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        
        console.log(`✅ ${endpoint}: ${response.status} - ${Array.isArray(data) ? data.length : 'N/A'} elementos`);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`   Primer elemento:`, data[0]);
        }
      } catch (error) {
        console.error(`❌ ${endpoint}: Error -`, error.message);
      }
    }
  }
  
  // Función para verificar el contexto de datos
  function checkDataContext() {
    console.log('🔄 Verificando contexto de datos...');
    
    // Intentar acceder al contexto React
    const reactRoot = document.querySelector('#__next');
    if (reactRoot && reactRoot._reactInternalFiber) {
      console.log('✅ React detectado');
    } else {
      console.log('⚠️ No se pudo detectar React');
    }
    
    // Verificar localStorage
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        console.log('✅ Datos de autenticación encontrados:', parsed);
      } catch (e) {
        console.log('⚠️ Datos de autenticación corruptos');
      }
    } else {
      console.log('⚠️ No hay datos de autenticación en localStorage');
    }
  }
  
  // Función para verificar errores de red
  function checkNetworkErrors() {
    console.log('🌐 Verificando errores de red...');
    
    // Interceptar errores de fetch
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args)
        .then(response => {
          if (!response.ok) {
            console.warn(`⚠️ Respuesta no exitosa: ${args[0]} - ${response.status}`);
          }
          return response;
        })
        .catch(error => {
          console.error(`❌ Error de red: ${args[0]} -`, error);
          throw error;
        });
    };
    
    console.log('✅ Interceptor de fetch instalado');
  }
  
  // Función para verificar el estado del dashboard
  function checkDashboardState() {
    console.log('📊 Verificando estado del dashboard...');
    
    // Buscar elementos del dashboard
    const dashboardElements = {
      'Tarjetas de estadísticas': document.querySelectorAll('[class*="stat"], [class*="card"]').length,
      'Tablas de datos': document.querySelectorAll('table').length,
      'Componentes de carga': document.querySelectorAll('[class*="loading"], [class*="spinner"]').length,
      'Mensajes de error': document.querySelectorAll('[class*="error"], [class*="alert"]').length
    };
    
    Object.entries(dashboardElements).forEach(([name, count]) => {
      console.log(`   ${name}: ${count}`);
    });
  }
  
  // Ejecutar diagnósticos
  async function runDiagnostics() {
    console.log('🚀 Ejecutando diagnósticos completos...');
    
    checkNetworkErrors();
    checkDataContext();
    checkDashboardState();
    
    await checkAPIs();
    
    console.log('✅ Diagnóstico completado. Revisa los logs anteriores para identificar problemas.');
    
    // Programar verificación periódica
    setTimeout(() => {
      console.log('🔄 Verificación periódica de APIs...');
      checkAPIs();
    }, 30000); // Cada 30 segundos
  }
  
  // Exponer funciones globalmente para uso manual
  window.debugSync = {
    checkAPIs,
    checkDataContext,
    checkNetworkErrors,
    checkDashboardState,
    runDiagnostics
  };
  
  // Ejecutar automáticamente
  runDiagnostics();
  
  console.log('💡 Funciones disponibles: window.debugSync.checkAPIs(), window.debugSync.runDiagnostics(), etc.');
})();