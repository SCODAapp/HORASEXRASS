export default function ConfigWarning() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Configuración Requerida
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Esta aplicación requiere configuración de GitHub Actions secrets para funcionar correctamente.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left mb-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Pasos para configurar:</h2>
            <ol className="space-y-3 text-blue-800">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Ve a <strong>Settings → Secrets and variables → Actions</strong></span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Agrega estos secrets:</span>
              </li>
              <ul className="ml-8 mt-2 space-y-2">
                <li className="font-mono text-sm bg-white px-3 py-2 rounded border border-blue-300">
                  VITE_SUPABASE_URL
                </li>
                <li className="font-mono text-sm bg-white px-3 py-2 rounded border border-blue-300">
                  VITE_SUPABASE_ANON_KEY
                </li>
              </ul>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Ve a <strong>Settings → Pages</strong> y habilita GitHub Pages con source: <strong>GitHub Actions</strong></span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Ejecuta el workflow en la pestaña <strong>Actions</strong></span>
              </li>
            </ol>
          </div>

          <div className="text-sm text-gray-500">
            Una vez configurado, la aplicación se desplegará automáticamente y estará lista para usar.
          </div>
        </div>
      </div>
    </div>
  );
}
