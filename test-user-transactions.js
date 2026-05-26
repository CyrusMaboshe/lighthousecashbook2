// Test script to add sample transactions for testing user analytics
import { supabase } from './src/integrations/supabase/client.js';

async function addTestTransactions() {
  console.log('Adding test transactions for user analytics testing...');
  
  // Sample transactions for testuser@lighthouse.com
  const testTransactions = [
    {
      date: '2024-12-01',
      time: '10:30:00',
      type: 'cash-in',
      category_name: 'Photography',
      amount: 150.00,
      customer_name: 'John Smith',
      number_of_pictures: 5,
      whatsapp_number: '+260971234567',
      details: 'Portrait session',
      added_by: 'Test User'
    },
    {
      date: '2024-12-02',
      time: '14:15:00',
      type: 'cash-in',
      category_name: 'Photography',
      amount: 200.00,
      customer_name: 'Mary Johnson',
      number_of_pictures: 8,
      whatsapp_number: '+260977654321',
      details: 'Wedding photos',
      added_by: 'Test User'
    },
    {
      date: '2024-12-03',
      time: '09:45:00',
      type: 'cash-in',
      category_name: 'Photography',
      amount: 100.00,
      customer_name: 'David Wilson',
      number_of_pictures: 3,
      whatsapp_number: '+260965432109',
      details: 'Family photos',
      added_by: 'Test User'
    },
    {
      date: '2024-12-04',
      time: '16:20:00',
      type: 'cash-in',
      category_name: 'Photography',
      amount: 300.00,
      customer_name: 'Sarah Brown',
      number_of_pictures: 12,
      whatsapp_number: '+260978901234',
      details: 'Event photography',
      added_by: 'Test User'
    },
    {
      date: '2024-12-05',
      time: '11:00:00',
      type: 'cash-out',
      category_name: 'Equipment',
      amount: 50.00,
      customer_name: 'Camera Store',
      number_of_pictures: 0,
      whatsapp_number: '',
      details: 'Memory card purchase',
      added_by: 'Test User'
    },
    {
      date: '2024-12-06',
      time: '13:30:00',
      type: 'cash-in',
      category_name: 'Photography',
      amount: 180.00,
      customer_name: 'Mike Davis',
      number_of_pictures: 6,
      whatsapp_number: '+260912345678',
      details: 'Corporate headshots',
      added_by: 'Test User'
    },
    {
      date: '2024-12-07',
      time: '15:45:00',
      type: 'cash-in',
      category_name: 'Photography',
      amount: 250.00,
      customer_name: 'Lisa Anderson',
      number_of_pictures: 10,
      whatsapp_number: '+260923456789',
      details: 'Graduation photos',
      added_by: 'Test User'
    }
  ];

  try {
    // Get Photography category ID
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('name', 'Photography')
      .single();

    if (catError) {
      console.log('Photography category not found, creating it...');
      const { data: newCategory, error: createError } = await supabase
        .from('categories')
        .insert({ name: 'Photography', type: 'cash-in' })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating Photography category:', createError);
        return;
      }
      categories = newCategory;
    }

    // Get Equipment category ID
    let equipmentCategory;
    const { data: equipCat, error: equipError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('name', 'Equipment')
      .single();

    if (equipError) {
      console.log('Equipment category not found, creating it...');
      const { data: newEquipCategory, error: createEquipError } = await supabase
        .from('categories')
        .insert({ name: 'Equipment', type: 'cash-out' })
        .select()
        .single();
      
      if (createEquipError) {
        console.error('Error creating Equipment category:', createEquipError);
        return;
      }
      equipmentCategory = newEquipCategory;
    } else {
      equipmentCategory = equipCat;
    }

    // Insert test transactions
    for (const transaction of testTransactions) {
      const categoryId = transaction.category_name === 'Photography' ? categories.id : equipmentCategory.id;
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          category_id: categoryId
        });

      if (error) {
        console.error('Error inserting transaction:', error);
      } else {
        console.log(`✅ Added transaction: ${transaction.customer_name} - ZMW ${transaction.amount}`);
      }
    }

    console.log('✅ All test transactions added successfully!');
    console.log('📊 You can now test user analytics with the Test User account');
    
  } catch (error) {
    console.error('Error adding test transactions:', error);
  }
}

addTestTransactions();
