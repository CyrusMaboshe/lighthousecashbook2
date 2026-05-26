/**
 * Execute Multi-Tenant Data Clearing
 * This script will completely clear all multi-tenant data
 */

import { clearAllMultiTenantData } from './clearMultiTenantTestData';

export async function executeMultiTenantDataClear() {
  console.log('🚨 WARNING: This will delete ALL multi-tenant data!');
  console.log('🔄 Starting data clearing process...');
  
  try {
    const result = await clearAllMultiTenantData();
    
    if (result.success) {
      console.log('✅ Data clearing completed successfully!');
      console.log('📊 Results:', result.message);
      console.log('📋 Details:', result.details);
    } else {
      console.error('❌ Data clearing failed:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Unexpected error during data clearing:', error);
    return {
      success: false,
      message: `Unexpected error: ${error}`,
      details: { error }
    };
  }
}

// Execute if run directly
if (typeof window !== 'undefined') {
  // Browser environment - can be called from console
  (window as any).executeMultiTenantDataClear = executeMultiTenantDataClear;
  console.log('🔧 Multi-tenant data clearing function available as: executeMultiTenantDataClear()');
}
