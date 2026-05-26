import { hashPassword } from './passwordUtils';

// Function to test what password would generate the stored hashes
export const findPasswordForHash = async () => {
  const users = [
    {
      email: 'cofidencekangila3@gmail.com',
      username: 'Dence',
      storedHash: '5f8ac3ec18c99a0b287e7f77a8f27afc613163389fc6bf1e34a208c31debdf84'
    },
    {
      email: 'cyrus@gmail.com', 
      username: 'cyrus',
      storedHash: '7a554d080661b7dbb5cf87c3135fe8c49d96fac97eaea018d6845659d2d190e1'
    },
    {
      email: 'henry@gmail.com',
      username: 'Henry', 
      storedHash: '406ab09a88fa9d3ed39bd3a99f2cf84a449a86ed9fed487af9c37c9a39ec8b25'
    }
  ];

  const commonPasswords = [
    'titanium',
    'password',
    '123456',
    'admin',
    'user',
    'test',
    'lighthouse',
    'cyrus',
    'henry',
    'dence',
    'confidence',
    'kangila',
    'maboshe',
    'password123',
    'admin123',
    'user123',
    'test123',
    'Dence',
    'Cyrus',
    'Henry',
    'DENCE',
    'CYRUS', 
    'HENRY',
    'Confidence',
    'Kangila',
    'Maboshe',
    'CONFIDENCE',
    'KANGILA',
    'MABOSHE'
  ];

  console.log('=== FINDING PASSWORDS FOR USERS ===');
  
  for (const user of users) {
    console.log(`\n--- Testing ${user.email} (${user.username}) ---`);
    console.log(`Target hash: ${user.storedHash}`);
    
    let found = false;
    for (const password of commonPasswords) {
      const hashedPassword = await hashPassword(password);
      if (hashedPassword === user.storedHash) {
        console.log(`✅ MATCH FOUND! Password for ${user.email} is: "${password}"`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log(`❌ No matching password found for ${user.email}`);
    }
  }
};

// Run the test
findPasswordForHash().catch(console.error);
