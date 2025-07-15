import React, { useState } from 'react'
import { diagnoseSupabaseSetup, testUploadFunctionality } from '../utils/supabaseStorage'

const SupabaseDebugger: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<{
    configured: boolean
    bucketExists: boolean
    canUpload: boolean
    errors: string[]
    recommendations: string[]
  } | null>(null)
  const [testing, setTesting] = useState(false)

  const runDiagnostics = async () => {
    setTesting(true)
    try {
      const result = await diagnoseSupabaseSetup()
      setDiagnostics(result)
      
      // Log to console for debugging
      console.log('🔍 Supabase Diagnostics:', result)
    } catch (error) {
      console.error('Diagnostics failed:', error)
      setDiagnostics({
        configured: false,
        bucketExists: false,
        canUpload: false,
        errors: [`Diagnostics failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Check browser console for detailed error information']
      })
    } finally {
      setTesting(false)
    }
  }

  const testUpload = async () => {
    setTesting(true)
    try {
      const result = await testUploadFunctionality()
      console.log('📤 Upload test result:', result)
      
      if (result.success) {
        alert('✅ Upload test successful!')
      } else {
        alert(`❌ Upload test failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Upload test error:', error)
      alert(`❌ Upload test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{ 
      background: '#f8f9fa', 
      border: '1px solid #dee2e6', 
      borderRadius: '8px', 
      padding: '1rem', 
      margin: '1rem 0',
      fontSize: '0.9rem'
    }}>
      <h4 style={{ color: '#495057', marginBottom: '1rem' }}>🔧 Supabase Debugger</h4>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button 
          onClick={runDiagnostics}
          disabled={testing}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: testing ? 'not-allowed' : 'pointer',
            opacity: testing ? 0.6 : 1
          }}
        >
          {testing ? 'Testing...' : 'Run Diagnostics'}
        </button>
        
        <button 
          onClick={testUpload}
          disabled={testing}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: testing ? 'not-allowed' : 'pointer',
            opacity: testing ? 0.6 : 1
          }}
        >
          {testing ? 'Testing...' : 'Test Upload'}
        </button>
      </div>

      {diagnostics && (
        <div style={{ background: 'white', padding: '1rem', borderRadius: '4px', border: '1px solid #e9ecef' }}>
          <h5 style={{ color: '#495057', marginBottom: '0.5rem' }}>Diagnostic Results:</h5>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span>{diagnostics.configured ? '✅' : '❌'}</span>
              <span>Supabase Configured: {diagnostics.configured ? 'Yes' : 'No'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span>{diagnostics.bucketExists ? '✅' : '❌'}</span>
              <span>Assets Bucket Exists: {diagnostics.bucketExists ? 'Yes' : 'No'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{diagnostics.canUpload ? '✅' : '❌'}</span>
              <span>Can Upload Files: {diagnostics.canUpload ? 'Yes' : 'No'}</span>
            </div>
          </div>

          {diagnostics.errors.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h6 style={{ color: '#dc3545', marginBottom: '0.5rem' }}>❌ Errors:</h6>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {diagnostics.errors.map((error, index) => (
                  <li key={index} style={{ color: '#dc3545', marginBottom: '0.25rem' }}>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {diagnostics.recommendations.length > 0 && (
            <div>
              <h6 style={{ color: '#fd7e14', marginBottom: '0.5rem' }}>💡 Recommendations:</h6>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {diagnostics.recommendations.map((rec, index) => (
                  <li key={index} style={{ color: '#fd7e14', marginBottom: '0.25rem' }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={{ 
        marginTop: '1rem', 
        padding: '0.75rem', 
        backgroundColor: '#e9ecef', 
        borderRadius: '4px',
        fontSize: '0.8rem',
        color: '#6c757d'
      }}>
        <strong>How to use:</strong>
        <ol style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
          <li>Click "Run Diagnostics" to check your Supabase setup</li>
          <li>If errors are found, follow the recommendations</li>
          <li>Run the SQL commands from SUPABASE_SETUP.md in your Supabase dashboard</li>
          <li>Click "Test Upload" to verify file upload works</li>
          <li>Check browser console for detailed error information</li>
        </ol>
      </div>
    </div>
  )
}

export default SupabaseDebugger